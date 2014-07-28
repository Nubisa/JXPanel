var fs = require('fs');
var pathModule = require('path');
var _active_user = require('./active_user');
var server = require('jxm');
var form_lang = require('./form_lang');

exports.defineMethods = function(){

    var killChild = function(term){
        term.stdout.removeAllListeners('data');
        term.stderr.removeAllListeners('data');
        term.removeAllListeners('close');
        term.owner.terminal_restarted = true;
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

        var child = require('child_process').execFile('bash', {
            maxBuffer:1e8,
            cwd:home,
            stdio: [ 'ignore', 1, 2 ]
        });
        child.owner = active_user;

        child.on('exit', function(){
            if(!this.owner.terminal_restarted){
                server.sendToGroup(_child.owner.groupIdPrefix + "Term", "updateTerminal", {reload:true});
            }
            else
                this.owner.terminal_restarted = false;
        });

        child.totalData = 0;
        var toClient = function(_child, data, err) {
            _child.totalData += data.length;
            if(_child.totalData>1e8){
                _child.owner.terminal = null;
                killChild(_child);
                server.sendToGroup(_child.owner.groupIdPrefix + "Term", "updateTerminal", {reload:true});
            }
            server.sendToGroup(_child.owner.groupIdPrefix + "Term", "updateTerminal", {data:data, e:err});
        };

        child.stdout._child = child;
        child.stderr._child = child;
        child.stdout.on('data', function(data){toClient(this._child, data, false);});
        child.stderr.on('data', function(data){toClient(this._child, data, true);});

        active_user.terminal = child;
        active_user.terminal.stdin.write('echo "{~*****[$(pwd)]*****~}"\n');
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
        if(params.create){
            createTerminal(env, params);
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

        if(params.g != active_user.groupIdPrefix || !active_user.terminal){
            server.sendCallBack(env, {err:form_lang.Get("EN", "Access Denied"), relogin:true});
            return;
        }

        active_user.terminal.stdin.write(params.c + '\necho "{~*****[$(pwd)]*****~}"\n');

        server.sendCallBack(env, {done:true});
    });
};