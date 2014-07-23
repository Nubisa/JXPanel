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

    users[sessionId].isSudo = params.isSudo;
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

        if(!fs.existsSync(locTo)){
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
};


var HostingPlanCheck = function(active_user) {

    this.active_user = active_user;
    var _this = this;

    var _user = null;
    // assigned plan to the user
    var _plan = null;
    // plans created in frame of assigned plan (_plan)
    // it is json { ret : array of rows , ids : array of ids }
    var _myPlans = null;


    var basicCheckWithRefresh = function(cb) {
        dbcache.refresh(function(err) {

            if (!cb)
                throw form_lang.Get(active_user.lang, "CallbackRequired");

            if (err) {
                cb(form_lang.Get(_this.active_user.lang, "DBCannotReadData") + " " + err);
                return;
            }

            var err = _this.basicCheck();
            cb(err);
        });
    };


    // returns false on success (which means err = false) or string error
    // call this method only inside dbcache.refresh(cb) callback
    this.basicCheck = function () {

        if (_this.active_user.isSudo) {
            return true;
        }

        var user = dbcache.GetAll(sqlite.user_table, { ID: _this.active_user.user_id });
        if (user.err || !user.rec || !user.rec.length) {
            return form_lang.Get(_this.active_user.lang, "DBCannotGetUser") + " " + user.err;
        }
        _user = user.rec[0];
//        console.log("user", _user);

        if (!_user["plan_table_id"]) {
            return form_lang.Get(_this.active_user.lang, "NoPlan");
        }

        var plan = dbcache.GetAll(sqlite.plan_table, { ID: _user["plan_table_id"] });
        if (plan.err || !plan.rec || !plan.rec.length) {
            return form_lang.Get(_this.active_user.lang, "DBCannotGetPlan") + " " + plan.err;
        }
//        console.log("plan", _plan);
        _plan = plan.rec[0];

        _myPlans = dbcache.GetAll(sqlite.plan_table, { "user_owner_id": _user["ID"] });
        if (_myPlans.err) {
            return form_lang.Get(_this.active_user.lang, "DBCannotGetPlan") + " " + _myPlans.err;
        }

        return false;
    };


    this.CanAddRecord = function(form_id, cb) {

        if (_this.active_user.isSudo) {
            if (cb) cb(false);
            return;
        }

        var method = null;
        if (form_id === "addUser") method = this.CanAddUser; else
        if (form_id === "addPlan") method = this.CanAddPlan; else
        if (form_id === "addDomain") method = this.CanAddDomain;

        if (!method) {
            cb(form_lang.Get(_this.active_user.lang, "UnknownForm"));
        } else {
            method(cb);
        }
    };

    this.CanAddUser = function(cb) {

        basicCheckWithRefresh(function(err) {
            if (err){
                cb(err);
                return;
            }

            // if user does not have any plans - needs to add them first
            if (!_myPlans.rec.length) {
                cb(form_lang.Get(_this.active_user.lang, "NoPlanOwned"));
                return;
            }

            var field = "plan_max_users";

            if (!_plan[field] && _plan[field] + "" !== "0") {
                // no limit for hosting plan
                cb(false)
                return;
            }

            var max_users = parseInt(_plan[field]);

            if (isNaN(max_users)) {
                cb(form_lang.Get(_this.active_user.lang, "ValueInvalidIntegerOf", null, [field]));
                return;
            }

            if (max_users === 0) {
                cb(form_lang.Get(_this.active_user.lang, "PlanCannotAddUsers"));
                return;
            }

            // let's count, how many users this user has has
            var users = dbcache.Get(sqlite.user_table, { "user_owner_id" : _user["ID"] });
            if (users.err) {
                cb(form_lang.Get(_this.active_user.lang, "DBCannotGetUser"));
                return;
            }

            if (users.rec.length >= max_users) {
                cb(form_lang.Get(_this.active_user.lang, "PlanCannotAddMoreUsers", null, [ max_users ]));
                return;
            }

            cb(false);
        });
    };

    this.CanAddPlan = function(cb) {

        basicCheckWithRefresh(function(err) {
            if (err){
                cb(err);
                return;
            }

            var field = "plan_max_plans";

            if (!_plan[field] && _plan[field] + "" !== "0") {
                // no limit for hosting plan
                cb(false)
                return;
            }

            var max_plans = parseInt(_plan[field]);

            if (isNaN(max_plans)) {
                cb(form_lang.Get(_this.active_user.lang, "ValueInvalidIntegerOf", null, [field]));
                return;
            }

            if (max_plans === 0) {
                cb(form_lang.Get(_this.active_user.lang, "PlanCannotAddPlans"));
                return;
            }

            if (_myPlans.rec.length >= max_plans) {
                cb(form_lang.Get(_this.active_user.lang, "PlanCannotAddMorePlans", null, [ max_plans ]));
                return;
            }

            cb(false);
        });


    };

    this.CanAddDomain = function(cb) {
        basicCheckWithRefresh(function(err) {
            if (err){
                cb(err);
                return;
            }

            var field = "plan_max_domains";

            if (!_plan[field] && _plan[field] + "" !== "0") {
                // no limit for hosting plan
                cb(false)
                return;
            }

            var max_domains = parseInt(_plan[field]);

            if (isNaN(max_domains)) {
                cb(form_lang.Get(_this.active_user.lang, "ValueInvalidIntegerOf", null, [field]));
                return;
            }

            if (max_domains === 0) {
                cb(form_lang.Get(_this.active_user.lang, "PlanCannotAddDomains"));
                return;
            }

            // let's count, how many domains this user  has
            var domains = dbcache.Get(sqlite.domain_table, { "user_owner_id" : _user["ID"] });
            if (domains.err) {
                cb(form_lang.Get(_this.active_user.lang, "DBCannotGetUser"));
                return;
            }

            if (domains.rec.length >= max_domains) {
                cb(form_lang.Get(_this.active_user.lang, "PlanCannotAddMoreDomains", null, [ max_domains ]));
                return;
            }

            cb(false);
        });
    };


    // call this method only inside dbcache.refresh(cb) callback
    this.GetRecords = function() {
        var ret = {};
        // keep this order
        ret.err = this.basicCheck();
        ret.user = _user;
        ret.plan = _plan;
        ret.myPlans = _myPlans;
        return ret;
    };


    // only user, to which hosting plan belongs can edit the record (user_table, domain_table or plan_table)
    this.CanEditRecord = function(form_id, cb) {

        if (_this.active_user.isSudo) {
            if (cb) cb(false);
            return;
        }

        basicCheckWithRefresh(function(err) {
            if (err){
                cb(err);
                return;
            }

            if (_plan["user_owner_id"] + "" !== _user["ID"] + "") {
                cb(form_lang.Get(_this.active_user.lang, "CannotEditRecord"));
                return;
            }

            cb(false);
        });
    };

    // call this method only inside dbcache.refresh(cb) callback
    // returns true or false
    this.CanSeeRecord = function (table_name_db, row) {

        if (_this.active_user.isSudo) {
            return true;
        }

        var ID = row["ID"];
        _this.basicCheck();

        var canSeePlan = function(user_table_row) {
            // plan which was given by parent user
//            var allowedPlanIds = [ _plan["ID"] ];
            var allowedPlanIds = [];
            // now we add plans, which was created by current user
            allowedPlanIds = allowedPlanIds.concat(_myPlans.ids);

            if (user_table_row["ID"] == ID && allowedPlanIds.indexOf(user_table_row["plan_table_id"]) !== -1 )
                return true;

            return false;
        };


        if (table_name_db === sqlite.user_table) {

            // user can see himself/herself
            if (ID === _this.active_user.user_id)
                return true;

            return canSeePlan(row);
        }


        if (table_name_db === sqlite.plan_table || table_name_db === sqlite.domain_table) {

            var owner_id = row["user_owner_id"];
            // user can see his/her own records
            if (owner_id === _this.active_user.user_id)
                return true;

            var ret = dbcache.Get(sqlite.user_table, { "ID" : owner_id }, true);
            if (ret.err || !ret.rec || !ret.rec[owner_id])
                return false;

//            console.log("canseeplan");
            return canSeePlan(ret.rec[owner_id]);
        }
    };

};

//{{user.LABELHERE}}
