var forms = require('../rendering/form_templates');
var view_permissions = require('../rendering/menu_creator');
var datatables = require('../rendering/datatable_templates');
var charts = require('./charts/charts');
var form_lang = require('./form_lang');
var server = require('jxm');
var path = require('path');
var fs = require('fs');
var exec = require('child_process').exec;
var downloads = require('./downloads');
var database = require("../install/database");
var system_tools = require('../system_tools');
var folder_tools = require('./user_folders');
var form_tools = require('../rendering/form_tools');
var page_utils = require('../rendering/page_utils');
var users = {};
var sessionIDs = {};

exports._users = users;

var newUser = function(session_id){
    function __user(sid){
        this.nameTitle = "John Doe";
        this.sessionId = sid;
        this.homeFolder = function(){
            if(this.__path)
                return this.__path;

            this.__path = folder_tools.getUserPath(database.getUser(this.username).plan, this.username);

            return this.__path;
        };
        this.lang = "EN";
        this.uid = 0;
        this.gid = 0;
        this.groupIdPrefix = "gr" + jxcore.utils.uniqueId();
        this.session = { forms:{} };
    }

    return new __user(session_id);
};

var markFile = folder_tools.markFile;

exports.loginUser = function(env, params){
    var sessionId = env.SessionID;

    users[sessionId] = newUser(sessionId);
    var ret = system_tools.getUserIDS(params.username);
    if (!ret) {
        users[sessionId] = null;
        delete(users[sessionId]);
        return false;
    }
    jxcore.store.shared.set(sessionId, Date.now());
    sessionIDs[sessionId] = 1;

    users[sessionId].gid = ret.gid;
    users[sessionId].uid = ret.uid;

    users[sessionId].username = params.username;
    users[sessionId].nameTitle = params.username; // TODO change it!!!
    users[sessionId].user_id = params.user_id;

    return true;
};

exports.getUser = function(sessionId)
{
    console.log("active_user::getUser", sessionId);

    if(!users[sessionId]){
        console.log("active_user::getUser not_exist");
        return null;
    }

    jxcore.store.shared.set(sessionId, Date.now());

    var user = database.getUser(users[sessionId].username);
    if(user) {
        if (user.plan)
            users[sessionId].plan = user.plan;

        users[sessionId].suspended = "";
        users[sessionId].suspended_txt = "";
        if (user.suspended) {
            var lang = users[sessionId].lang;
            var labels = form_tools.getFormsLabels(lang);
            var str = "<strong>" + form_lang.Get(lang, "YouAreSuspended", true, [labels[user.suspended] || user.suspended]) + "</strong>";
            str += " " + form_lang.Get(lang, "YouAreSuspendedExtra", true);

            users[sessionId].suspended_txt = str;
            users[sessionId].suspended = page_utils.getErrorBar(str);
        }
    }

    return users[sessionId];
};


exports.checkUser = function(env, checkIfSuspended, form_name) {
    var active_user = exports.getUser(env.SessionID, false);

    if(!active_user){
        server.sendCallBack(env, {err:form_lang.Get("EN", "Access Denied")});
        return null;
    }

    if (checkIfSuspended && active_user.suspended_txt) {
        if (!form_name || !exports.isRecordUpdating(active_user, form_name)) {
            server.sendCallBack(env, {err: active_user.suspended_txt, hideForm : true });
            return null;
        }
    }

    return active_user;
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

    return view_permissions.hasView(users[sessionId], file);
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
    jxcore.store.shared.remove(sessionId);
    delete(sessionIDs[sessionId]);
    delete users[sessionId];
};

// called when deleting a user from panel
exports.clearUserByName = function(username) {
    for(var sessionId in users) {
        if (users[sessionId].username === username) {
            exports.clearUser(sessionId);
        }
    }
};

exports.isRecordUpdating = function(active_user, formName) {
    var isUpdate = active_user.session.edits && active_user.session.edits[formName] && active_user.session.edits[formName].ID;
    return isUpdate;
};


exports.defineMethods = function(){
    var scheduler = require('./scheduler/scheduler');

    // CLEAR USERS BEGIN
    setInterval(function(){
       if(scheduler.isBusy)
         return;
       scheduler.isBusy = true;
       jxcore.tasks.runOnThread(1, scheduler.doJobs, sessionIDs, function(){
           scheduler.isBusy = false;
       });
    },5000);
// CLEAR USERS END

    server.addJSMethod("getFileInfo", function(env, params){
        console.log("getFileInfo", params);

        var active_user = exports.getUser(env.SessionID);
        if(!active_user || !params.up || !params.up.indexOf || params.up.indexOf("..")>=0){
            server.sendCallBack(env, {err:form_lang.Get("EN", "Access Denied"), relogin:true});
            return;
        }

        var home = active_user.homeFolder();
        var loc;
        if(params.up == "")
            params.up = "#";

        if(params.up == "#"){
            loc = home;
        }
        else{
            loc = home + path.sep + params.up;
        }

        fs.lstat(loc, function(err, info){
            if(err){
                server.sendCallBack(env, {err:err, relogin:false});
                return;
            }

            server.sendCallBack(env, {info:info, id:params.id});
        });
    });

    server.addJSMethod("getFiles", function(env, params){
        console.log("getFiles", params);

        var active_user = exports.getUser(env.SessionID);
        if(!active_user || !params.up || !params.up.indexOf || params.up.indexOf("..")>=0){
            server.sendCallBack(env, {err:form_lang.Get("EN", "Access Denied"), relogin:true});
            return;
        }

        var home = active_user.homeFolder();
        var loc;
        if(params.up == "")
            params.up = "#";

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
                _nodes = [{name:'/', children:_nodes, open:true}];
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

        var src;
        try{
            src = fs.readFileSync(loc) + "";
        }
        catch(e){
            server.sendCallBack(env, {err:e});
            return;
        }

        server.sendCallBack(env, {source:src, id:params.id, tp:params.tp, fn:params.fn, loc:params.up});
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
            return;
        }

        var res = markFile(loc, active_user.uid, active_user.gid);

        if(res && res.exitCode != 0){
            server.sendCallBack(env, {err:res.out});
            return;
        }

        server.sendCallBack(env, {done:true});
    });


    server.addJSMethod("addFileFolder", function(env, params){
        console.log("addFileFolder", params);

        var active_user = exports.checkUser(env, true);
        if (!active_user)
            return;

        if(!params.up || !params.up.indexOf || params.up.indexOf("..")>=0){
            server.sendCallBack(env, {err:form_lang.Get("EN", "Access Denied"), relogin:true});
            return;
        }

        var home = active_user.homeFolder();
        if(params.up[0] == "/"){
            if(params.up.length>1)
                params.up = params.up.substr(1);
            else
                params.up = "";
        }

        var loc = home + path.sep + params.up;

        if(!fs.existsSync(loc)){
            server.sendCallBack(env, {err:form_lang.Get(active_user.lang, "FileNotFound"), relogin:false, reloadTree:true});
            return;
        }

        try{
            var target = loc + path.sep + params.name;
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
            return;
        }

        var res = markFile(target, active_user.uid, active_user.gid);

        if(res && res.exitCode != 0){
            server.sendCallBack(env, {err:res.out});
            return;
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
            return;
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
            return;
        }

        var res = markFile(locTo, active_user.uid, active_user.gid);

        if(res && res.exitCode != 0){
            server.sendCallBack(env, {err:res.out});
            return;
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

    server.addJSMethod("chFile", function(env, params){
        console.log("chFile", params);

        var active_user = exports.getUser(env.SessionID);
        if(!active_user || !params.up || !params.up.indexOf || params.up.indexOf("..")>=0){
            server.sendCallBack(env, {err:form_lang.Get("EN", "Access Denied"), relogin:true});
            return;
        }

        var home = active_user.homeFolder();

        var loc = params.up;
        if(loc && loc.length && loc[0] == '/'){
            loc = loc.substr(1, loc.length-1);
        }

        var target = home + path.sep + loc;
        if(!fs.existsSync(target)){
            server.sendCallBack(env, {err:form_lang.Get(active_user.lang, "FileNotFound"), relogin:false, reloadTree:true});
            return;
        }

        var res = jxcore.utils.cmdSync("chmod " + params.to + " " + target);
        if(res.exitCode == 0)
            res = markFile(target, active_user.uid, active_user.gid);

        if(res && res.exitCode != 0){
            server.sendCallBack(env, {err:res.out});
            return;
        }

        server.sendCallBack(env, {done:true});
    });

    server.addJSMethod("userIn", function(env, params){
        var val = {done:true};

        if(!env.SessionID || !users[env.SessionID]){
            val.relogin = true;
            server.sendCallBack(env, val);
            return;
        }

        server.sendCallBack(env, val);
    });
};
