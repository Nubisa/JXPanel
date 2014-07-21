var forms = require('../rendering/form_templates');
var datatables = require('../rendering/datatable_templates');
var charts = require('./charts/charts');
var form_lang = require('./form_lang');
var server = require('jxm');
var users = {};
var path = require('path');
var fs = require('fs');
var dbcache = require("./../db/dbcache");
var sqlite = require("./../db/sqlite");

exports.rootID = "1305444776609";

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

    users[sessionId].checkHostingPlan = new HostingPlanCheck(users[sessionId]);
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
        if(params.up == "/"){
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
            server.sendCallBack(env, {err:form_lang.Get("EN", "FileNotFound"), relogin:false, reloadTree:true});
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
            server.sendCallBack(env, {err:form_lang.Get("EN", "FileNotFound"), relogin:false, reloadTree:true});
            return;
        }

        fs.writeFileSync(loc, unescape(params.src));
        server.sendCallBack(env, {done:true});
    });
};




var HostingPlanCheck = function(active_user) {

    this.active_user = active_user;
    var _this = this;

    var _user = null;
    var _plan = null;


    var basicCheck = function(cb) {
        dbcache.refresh(function(err) {

            if (!cb)
                throw form_lang.Get(active_user.lang, "CallbackRequired");

            if (err) {
                cb(form_lang.Get(_this.active_user.lang, "DBCannotReadData") + " " + err);
                return;
            }

            if (_this.active_user.user_id === exports.rootID) {
                cb(false);
                return;
            }

            _user = dbcache.Get(sqlite.user_table, { ID : _this.active_user.user_id });
            if (_user.err || !_user.ret) {
                cb(form_lang.Get(_this.active_user.lang, "DBCannotGetUser") + " " + _user.err);
                return;
            }
            console.log("user", _user);

            if (!_user.ret["plan_table_id"]) {
                cb(form_lang.Get(_this.active_user.lang, "NoPlan"));
                return;
            }

            var _plan =  dbcache.Get("plan_table", { ID : _user.ret["plan_table_id"] });
            console.log("plan", _plan);

        });
    };


    this.CanAddRecord = function(form_id, cb) {

        var method = null;
        if (form_id === "addUser") method = this.CanAddUser; else
        if (form_id === "addPlan") method = this.CanAddPlan; else
        if (form_id === "addDomain") method = this.CanAddDomain;

        if (!method) {
            cb(form_lang.Get(_this.active_user.lang, "UnknownForm"));
        } else {
            method(cb);
        }
    }

    this.CanAddUser = function(cb) {

        basicCheck(function(err) {
            if (err){
                cb(err);
                return;
            }

            // todo: check fo user limits
            dbcache.Get(sqlite.data_value_table, {});

            cb(false);
        });
    };

};

//{{user.LABELHERE}}
