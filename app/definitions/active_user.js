var forms = require('../rendering/form_templates');
var datatables = require('../rendering/datatable_templates');
var charts = require('./charts/charts');
var form_lang = require('./form_lang');
var server = require('jxm');
var users = {};
var path = require('path');
var fs = require('fs');


var newUser = function(session_id){
    return {
        nameTitle: "John Doe",
        sessionId: session_id,
        homeFolder: function(){
            // TODO return user's home path (www path)

            var home = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE; // temporary
            return home + "/Desktop";
        },
        lang: "EN",
        session: { forms:{} },
        lastOperation: Date.now() // TODO later clear the users
     };
};

exports.loginUser = function(sessionId, params){
    users[sessionId] = newUser(sessionId);
    users[sessionId].username = params.username;

    users[sessionId].nameTitle = params.username; // TODO change it!!!

    users[sessionId].user_id = params.user_id;
};

exports.getUser = function(sessionId)
{
    console.log("active_user::getUser", sessionId);

    if(!users[sessionId]){
        console.log("active_user::getUser not_exist");
        return null;
    }

    return users[sessionId];
};

exports.getForm = function(sessionId, form_name){
    // TODO check permissions to form
    console.log("active_user::getForm", sessionId, form_name);

    return forms.renderForm(sessionId, form_name);
};


exports.getChart = function(sessionId, chart_name, index){
    // TODO check permissions to chart
    console.log("active_user::getChart", sessionId, chart_name);

    return charts.getChart(sessionId, chart_name, index);
};


exports.hasPermission = function(sessionId, file){
    console.log("active_user::hasPermission", sessionId, file); // file path
    if(file != "../ui//index.html"){
        if(!users[sessionId]){
            return false;
        }
    }

    return true;
};


exports.getDataTable = function(sessionId, table_name){
//    console.log("active_user::getDataTable", sessionId, table_name);

    return datatables.render(sessionId, table_name);
};


exports.clearUser = function(sessionId) {
    delete users[sessionId];
};


exports.isRecordUpdating = function(active_user, formName) {
    var isUpdate = active_user.session.edits && active_user.session.edits[formName] && active_user.session.edits[formName].ID;
    return isUpdate;
};


exports.defineMethods = function(){
    server.addJSMethod("getFiles", function(env, params){
        console.log("getFiles", params);

        var active_user = exports.getUser(env.SessionID);
        if(!active_user){
            server.sendCallBack(env, {err:form_lang.Get("EN", "Access Denied"), relogin:true});
            return;
        }

        var home = active_user.homeFolder();
        var loc;
        if(params.up == "#"){
            loc = home;
        }
        else{
            loc = home + path.sep + params.up;
        }

        var loading = form_lang.Get(active_user.lang, "Loading");

        fs.readdir(loc, function(err, files){
            if(err){
                server.sendCallBack(env, {err:err, relogin:false});
                return;
            }
            var _nodes = [];
            for(var o in files){
                var fname = loc + path.sep + files[o];
                var is_dir = fs.statSync(fname).isDirectory();
                if(is_dir){
                    _nodes.push({isParent:true, name:files[o], children:[{name:loading}]});
                }
                else
                    _nodes.push({name:files[o]});
            }

            if(params.up == "#"){
                _nodes = {name:'/', children:_nodes, open:true};
            }

            server.sendCallBack(env, {nodes:_nodes, id:params.id});
        });
    });


    server.addJSMethod("getFile", function(env, params){
        console.log("getFile", params);

        var active_user = exports.getUser(env.SessionID);
        if(!active_user){
            server.sendCallBack(env, {err:form_lang.Get("EN", "Access Denied"), relogin:true});
            return;
        }

        var home = active_user.homeFolder();
        var loc = home + path.sep + params.up;

        if(!fs.existsSync(loc)){
            server.sendCallBack(env, {err:form_lang.Get(active_user.lang, "FileNotFound"), relogin:false, reloadTree:true});
            return;
        }

        server.sendCallBack(env, {source:fs.readFileSync(loc)+"", id:params.id, tp:params.tp, fn:params.fn, loc:params.up});
    });


    server.addJSMethod("saveFile", function(env, params){
        console.log("saveFile", params);

        var active_user = exports.getUser(env.SessionID);
        if(!active_user){
            server.sendCallBack(env, {err:form_lang.Get("EN", "Access Denied"), relogin:true});
            return;
        }

        var home = active_user.homeFolder();
        var loc = home + path.sep + params.up;

        if(!fs.existsSync(loc)){
            server.sendCallBack(env, {err:form_lang.Get(active_user.lang, "FileNotFound"), relogin:false, reloadTree:true});
            return;
        }

        try{
            fs.writeFileSync(loc, unescape(params.src));
        }
        catch(e){
            server.sendCallBack(env, {err:e});
        }
        server.sendCallBack(env, {done:true});
    });


    server.addJSMethod("addFileFolder", function(env, params){
        console.log("addFileFolder", params);

        var active_user = exports.getUser(env.SessionID);
        if(!active_user){
            server.sendCallBack(env, {err:form_lang.Get("EN", "Access Denied"), relogin:true});
            return;
        }

        var home = active_user.homeFolder();
        var loc = home + path.sep + params.up;

        if(!fs.existsSync(loc)){
            server.sendCallBack(env, {err:form_lang.Get(active_user.lang, "FileNotFound"), relogin:false, reloadTree:true});
            return;
        }

        try{
            if(params.opt == "File")
               fs.writeFileSync(loc + path.sep + params.name, "");
            else
               fs.mkdirSync(loc + path.sep + params.name);
        }
        catch(e){
            server.sendCallBack(env, {err: e});
        }
        server.sendCallBack(env, {done:true});
    });


    server.addJSMethod("removeFileFolder", function(env, params){
        console.log("removeFileFolder", params);

        var active_user = exports.getUser(env.SessionID);
        if(!active_user){
            server.sendCallBack(env, {err:form_lang.Get("EN", "Access Denied"), relogin:true});
            return;
        }

        var home = active_user.homeFolder();
        var loc = home + path.sep + params.up;

        if(!fs.existsSync(loc)){
            server.sendCallBack(env, {err:form_lang.Get(active_user.lang, "FileNotFound"), relogin:false, reloadTree:true});
            return;
        }

        try{
            if(fs.lstatSync(loc).isDirectory()){
                if(fs.readdirSync(loc).length){
                    server.sendCallBack(env, {err: {Message:form_lang.Get(active_user.lang, "FolderNotEmpty")}});
                    return;
                }
                else
                    fs.rmdirSync(loc);
            }
            else
                fs.unlinkSync(loc);
        }
        catch(e){
            server.sendCallBack(env, {err: e});
        }
        server.sendCallBack(env, {done:true});
    });


    server.addJSMethod("renameFileFolder", function(env, params){
        console.log("renameFileFolder", params);

        var active_user = exports.getUser(env.SessionID);
        if(!active_user){
            server.sendCallBack(env, {err:form_lang.Get("EN", "Access Denied"), relogin:true});
            return;
        }

        var home = active_user.homeFolder();
        var loc = home + path.sep + params.up;
        var locTo = home + path.sep + params.down;

        if(!fs.existsSync(loc)){
            server.sendCallBack(env, {err:form_lang.Get(active_user.lang, "FileNotFound"), relogin:false, reloadTree:true});
            return;
        }

        if(fs.existsSync(locTo)){
            server.sendCallBack(env, {err:form_lang.Get(active_user.lang, "FileExists"), relogin:false, reloadTree:true});
            return;
        }

        try{
            fs.renameSync(loc, locTo);
        }
        catch(e){
            server.sendCallBack(env, {err: e});
        }
        server.sendCallBack(env, {done:true});
    });

    server.addJSMethod("downloadFile", function(env, params){
        console.log("downloadFile", params);

        var active_user = exports.getUser(env.SessionID);
        if(!active_user){
            server.sendCallBack(env, {err:form_lang.Get("EN", "Access Denied"), relogin:true});
            return;
        }

        var home = active_user.homeFolder();
        var loc = home + path.sep + params.up;

        if(!fs.existsSync(loc)){
            server.sendCallBack(env, {err:form_lang.Get(active_user.lang, "FileNotFound"), relogin:false, reloadTree:true});
            return;
        }

        var stat = fs.lstatSync(loc);
        if(stat.isDirectory()){

        }

        server.sendCallBack(env, {done:true});
    });
};


//{{user.LABELHERE}}
