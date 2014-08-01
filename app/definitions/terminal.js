var fs = require('fs');
var pathModule = require('path');
var _active_user = require('./active_user');
var server = require('jxm');
var form_lang = require('./form_lang');

exports.defineMethods = function(){

    var killChild = function(term){
        term.kill();
    };

    var createTerminal = function(env, params){
        console.log("connectToTerminal", params);

        var active_user = _active_user.getUser(env.SessionID);
        if(!active_user){
            server.sendCallBack(env, {err:form_lang.Get("EN", "Access Denied"), relogin:true});
            return;
        }

        if(active_user.terminal){
            killChild(active_user.terminal);
            active_user.terminal = null;
            server.sendToGroup(active_user.groupId, "updateTerminal", {reload:true});
            server.sendCallBack(env, {reload:true});
            server.unSubscribeClient(env, active_user.groupIdPrefix + "Term");
            return;
        }

        server.subscribeClient(env, active_user.groupIdPrefix + "Term");
        var home = active_user.homeFolder();

        var child = require('pty.js').spawn('bash', [], {
            name: 'xterm-color',
            cols: 80,
            rows: 30,
            cwd: home,
            gid: active_user.gid,
            uid: active_user.uid
        });

        child.socket.owner = active_user;

        child.on('exit', function(){
            console.log("terminal exit");
            server.sendToGroup(this.owner.groupIdPrefix + "Term", "updateTerminal", {exit:true});
            this.owner.terminal = null;
        });

        child.totalData = 0;
        var toClient = function(_socket, data, err) {
            if(!data || !data.indexOf)
                return;
            if(data.length==4 && ( data.indexOf("[3G")==1 || data.indexOf("[1G")==1 || data.indexOf("[0J")==1 ) )
            {
                return;
            }
            var ind = data.indexOf("]0;");
            if(ind >= 0){
                var ln = data.length;
                for(var i=0;i<ln;i++){
                    if(data.charCodeAt(i) == 7){
                        var str = data.substr(ind, i-ind);
                        data = data.replace(str, "");
                        break;
                    }
                }
            }

            server.sendToGroup(_socket.owner.groupIdPrefix + "Term", "updateTerminal", {data:data, e:err});
        };

        child.on('data', function(data) {
            toClient(this, data, false);
        });
        child.on('error', function(data){
            toClient(this, data, true);
        });

        active_user.terminal = child;
        server.sendCallBack(env, {g:active_user.groupIdPrefix});
    };

    server.addJSMethod("connectToTerminal", createTerminal);

    server.addJSMethod("killTerminal", function(env, params){
        console.log("killTerminal", params);

        var active_user = _active_user.getUser(env.SessionID);
        if(!active_user){
            server.sendCallBack(env, {err:form_lang.Get("EN", "Access Denied"), relogin:true});
            return;
        }

        if(active_user.terminal){
            killChild(active_user.terminal);
            active_user.terminal = null;
        }

        server.sendCallBack(env, {done:true});
    });

    server.addJSMethod("sendToTerminal", function(env, params){
        console.log("sendToTerminal", params);

        var active_user = _active_user.getUser(env.SessionID);
        if(!active_user){
            server.sendCallBack(env, {err:form_lang.Get("EN", "Access Denied"), relogin:true});
            return;
        }

        if(params.g != active_user.groupIdPrefix){
            server.sendCallBack(env, {err:form_lang.Get("EN", "Access Denied"), relogin:true});
            return;
        }

        if(!active_user.terminal){
            server.sendToGroup(active_user.groupIdPrefix + "Term", "updateTerminal", {exit:true});
           return;
        }

        active_user.terminal.write(params.c + '\n');
        server.sendCallBack(env, {done:true});
    });
};