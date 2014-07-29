var forms = require('../rendering/form_templates');
var datatables = require('../rendering/datatable_templates');
var charts = require('./charts/charts');
var form_lang = require('./form_lang');
var server = require('jxm');
var users = {};
var path = require('path');
var fs = require('fs');
var exec = require('child_process').exec;
var downloads = require('./downloads');
var database = require("../db/database");

// CLEAR USERS BEGIN
setInterval(function(){
    var dt = Date.now();
    for(var o in users){
        if(users[o]){
            if(dt> users[o].lastOperation + 600000){ // 10 mins timeout
                exports.clearUser(o);
                break;
            }
        }
    }
},5000);
// CLEAR USERS END

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
        uid:0,
        gid:0,
        groupIdPrefix: "gr" + jxcore.utils.uniqueId(),
        session: { forms:{} },
        lastOperation: Date.now() // TODO later clear the users
     };
};

exports.loginUser = function(env, params){
    var sessionId = env.SessionID;

    users[sessionId] = newUser(sessionId);
    var ret = jxcore.utils.cmdSync("id -u " + params.username);
    users[sessionId].uid = parseInt(ret.out);
    if (isNaN(users[sessionId].uid)) {
        users[sessionId] = null;
        delete(users[sessionId]);
        return false;
    }
    ret = jxcore.utils.cmdSync("id -g " + params.username);
    users[sessionId].gid = parseInt(ret.out);
    if (isNaN(users[sessionId].gid)) {
        users[sessionId] = null;
        delete(users[sessionId]);
        return false;
    }

    users[sessionId].username = params.username;
    users[sessionId].nameTitle = params.username; // TODO change it!!!
    users[sessionId].user_id = params.user_id;

    database.errorEngine = new errorEngine(users[sessionId]);

    return true;
};


var errorEngine = function(active_user) {

    var __active_user = active_user;

    this.getError = function(str, arrParams) {
        return form_lang.Get(__active_user.lang, str, null, arrParams);
    };
};

exports.getUser = function(sessionId)
{
    console.log("active_user::getUser", sessionId);

    if(!users[sessionId]){
        console.log("active_user::getUser not_exist");
        return null;
    }

    users[sessionId].lastOperation = Date.now();

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
    if(users[sessionId].terminal){
        try{
            users[sessionId].terminal.terminal_restarted = true; // saying that we killed it
            users[sessionId].terminal.kill();
        }catch(e){}
    }
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
        if(!active_user || !params.up || !params.up.indexOf || params.up.indexOf("..")>=0){
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
        if(!active_user || !params.up || !params.up.indexOf || params.up.indexOf("..")>=0){
            server.sendCallBack(env, {err:form_lang.Get("EN", "Access Denied"), relogin:true});
            return;
        }

        var home = active_user.homeFolder();
        var loc = home + path.sep + params.up;

        var is_dir = fs.statSync(loc).isDirectory();
        if(is_dir){
            server.sendCallBack(env, {skip:true});
            return;
        }

        if(!fs.existsSync(loc)){
            server.sendCallBack(env, {err:form_lang.Get(active_user.lang, "FileNotFound"), relogin:false, reloadTree:true});
            return;
        }

        server.sendCallBack(env, {source:fs.readFileSync(loc)+"", id:params.id, tp:params.tp, fn:params.fn, loc:params.up});
    });


    server.addJSMethod("saveFile", function(env, params){
        console.log("saveFile", params);

        var active_user = exports.getUser(env.SessionID);
        if(!active_user || !params.up || !params.up.indexOf || params.up.indexOf("..")>=0){
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
        if(!active_user || !params.up || !params.up.indexOf || params.up.indexOf("..")>=0){
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
            var target = oc + path.sep + params.name;
            if(fs.existsSync(target)){
                server.sendCallBack(env, {err:form_lang.Get(active_user.lang, "FileExists")});
                return;
            }
            if(params.opt == "File")
               fs.writeFileSync(target, "");
            else
               fs.mkdirSync(target);
        }
        catch(e){
            server.sendCallBack(env, {err: e});
        }
        server.sendCallBack(env, {done:true});
    });


    server.addJSMethod("removeFileFolder", function(env, params){
        console.log("removeFileFolder", params);

        var active_user = exports.getUser(env.SessionID);
        if(!active_user || !params.up || !params.up.indexOf || params.up.indexOf("..")>=0){
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
        if(!active_user || !params.up || !params.up.indexOf || params.up.indexOf("..")>=0){
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
        if(!active_user || !params.up || !params.up.indexOf || params.up.indexOf("..")>=0){
            server.sendCallBack(env, {err:form_lang.Get("EN", "Access Denied"), relogin:true});
            return;
        }

        var home = active_user.homeFolder();
        if(!fs.existsSync(home + path.sep + "__panel_downloads")){
            fs.mkdirSync(home + path.sep + "__panel_downloads");
        }

        var loc = params.up;
        if(loc && loc.length && loc[0] == '/'){
            loc = loc.substr(1, loc.length-1);
        }

        if(!fs.existsSync(home + path.sep + loc)){
            server.sendCallBack(env, {err:form_lang.Get(active_user.lang, "FileNotFound"), relogin:false, reloadTree:true});
            return;
        }

        var zip_name = "File_" + Date.now() + "_" + jxcore.utils.uniqueId() + ".zip";
        var zip_location = home + path.sep + "__panel_downloads" + path.sep + zip_name;
        exec("zip -r " + zip_location + " " + loc, {cwd:home, uid:active_user.uid, maxBuffer:1e7}, function(err, stdout, stderr){
            if (err !== null) {
                server.sendCallBack(env, {err:"Error" + JSON.stringify( err ) + (stderr || stdout) });
            }
            else if(!fs.existsSync(zip_location)){
                server.sendCallBack(env, {err: "Output:" + (stderr || stdout)});
            }
            else{
                downloads.list["/" + zip_name] = {count:1, location:zip_location};
                server.sendCallBack(env, {link:"/" + zip_name, name:zip_name});
            }
        });
    });

    server.addJSMethod("userIn", function(env, params){
        if(!users[env.SessionID]){
            server.sendCallBack(env, {relogin:true});
            return;
        }
        server.sendCallBack(env, {done:true});
    });
};


//{{user.LABELHERE}}
