var _active_user = require('../definitions/active_user');
var form_lang = require('../definitions/form_lang');
var datatables = require('./datatable_templates');
var forms = require('./form_templates');
var util = require("util");
var server = require('jxm');
var pam = require('authenticate-pam');
var methods = {};
var sqlite = require("./../db/sqlite.js");
var dbcache = require("./../db/dbcache.js");
var crypto = require('crypto');

var checkUser = function(env){
    var active_user = _active_user.getUser(env.SessionID, false);

    if(!active_user){
        server.sendCallBack(env, {err:form_lang.Get("EN", "Access Denied")});
        return null;
    }

    return active_user;
};

methods.tryLogin = function(env, params){
    pam.authenticate(params.username, params.password, function(err) {
        if(err) {
            server.sendCallBack(env, {err: form_lang.Get(params.lang, "CredentialsFailed")});
        }
        else {

            var finish = function() {

                _active_user.loginUser(env.SessionID, params);
                var _url = "/dashboard.html";
                if(params.url && params.url.indexOf){
                    var ind = params.url.indexOf("t=");
                    if(params.url.length>ind+7 && ind>0){ // something.html
                        if(ind>0)
                            ind += 2;
                        _url = params.url.substr(ind, params.url.length-(ind)).trim();
                    }
                }
                server.sendCallBack(env, {url: _url});
            };

            // todo: for now only root is superuser of the panel
            params.isSudo = params.username === "root";

//            finish();
//            return;

            // if user was authenticated for linux, lets check if he is present in user_table
            dbcache.refresh(function(err) {

                if (err) {
                    server.sendCallBack(env, {err: form_lang.Get(params.lang, "DBCannotReadData") + " " + err });
                    return;
                }

                var user = dbcache.Get(sqlite.user_table, { username: params.username});
                if (user.rec && user.rec.length) {
                    // user exists
                    params.user_id = user.rec[0].ID;
                    finish();
                    return;
                }


                if (user.rec.length === 0) {

                    server.sendCallBack(env, {err: form_lang.Get(params.lang, "CannotLoginNoUser")});
                    return;
//                    // first sudo login
//
//                    if (!dbcache.tables[sqlite.plan_table][0]) {
//                        server.sendCallBack(env, {err: form_lang.Get(params.lang, "DBCannotGetPlan")});
//                        return;
//                    }
//
//                    var unlimited_plan_id = dbcache.tables[sqlite.plan_table][0]["ID"];
//
//                    // user does not exist
//                    sqlite.User.AddNewOrUpdateAll(sqlite.db, { person_name : params.username, username : params.username, plan_table_id : unlimited_plan_id }, { insert: ["username"] },  function(err2, id) {
//                          if (err2) {
//                            server.sendCallBack(env, {err: form_lang.Get(params.lang, "DBCannotAddUser") + " " + err2});
//                        } else {
//                            params.user_id = id;
//                            finish();
//                            return;
//                        }
//                    });
                }
            });
        }
    });
};

var sessionAdd = function(env, active_user, params){
    var active_user = checkUser(env);

    if(!active_user || !params.form || !params.controls || !active_user.session.forms[params.form]){
        // TODO send a notification or redirect user page to login!
        server.sendCallBack(env, {err: form_lang.Get(active_user.lang, "SessionExpired"), relogin:true });
        return false;
    }

    console.log("handling submitted values", params);

    var sform = active_user.session.forms[params.form].activeInstance;

    var messages = [];

    for(var o in params.controls){

        var ctrl = null;
        for(var i in sform.controls){
            if(sform.controls[i].name == o){
                ctrl = sform.controls[i];
            }
        }

        if(!ctrl)
            continue;

        var ctrlDisplayName = form_lang.Get(active_user.lang, ctrl.details.label, true);

        // checking if field is required and has a value
        if (ctrl.options && ctrl.options.required && !params.controls[o]) {
            messages.push({control:ctrlDisplayName, msg:form_lang.Get(active_user.lang, "ValueRequired")});
        }

        var valids = [];

        if(ctrl.validation) {
//            console.log("isarray? ", util.isArray(ctrl.validation), ctrl.validation);
            // multiple validations for one field
            if (util.isArray(ctrl.validation)) {
                valids = valids.concat(ctrl.validation);
            } else {
                valids.push(ctrl.validation);
            }
        }

        if (valids.length) {
           for(var a in valids) {

               if (ctrl.details && ctrl.details.options.dont_update_null && !params.controls[o]) {
                   continue;
               }

               var res = valids[a].validate(env, active_user, params.controls[o], params.controls);
               if(!res.result){
                   messages.push({control:ctrlDisplayName, msg:res.msg});
               }
           }
        }
    }

    if(messages.length){
        server.sendCallBack(env, {arr:messages});
        return false;
    }
    else
        return true;
};

var getFormControls = function(activeInstance) {

    if (!activeInstance)
        throw "Instance of the form is empty.";

    var ret = {};
    for(var i in activeInstance.controls) {
        if (activeInstance.controls[i].name)
            ret[activeInstance.controls[i].name] = activeInstance.controls[i];
    }
    return ret;
};


methods.sessionApply = function(env, params){

    var active_user = checkUser(env);

    if(!sessionAdd(env, active_user, params))
        return;

    var activeForm = active_user.session.forms[params.form];
    var activeInstance = activeForm.activeInstance;


    var _controls = getFormControls(activeInstance);

    var isUpdate = _active_user.isRecordUpdating(active_user, params.form);

    var json = {};
    var cnt = 0;
    for (var field_name in params.controls) {
        var val = params.controls[field_name];
        if (_controls[field_name]) {
            cnt++;
            var ctrl = _controls[field_name];
            var det = ctrl.details;

            if (det.options.dont_update_null && !val) {
                continue;
            }

            if (det.dbName) {
                // replacing form controls names into db field names
                field_name = det.dbName;
            }

            if (ctrl.convert)
                json[field_name ] = ctrl.convert(val);
            else
                json[field_name] = val;
        }
    }

    if (!cnt) {
        server.sendCallBack(env, {arr: [ { control: form_lang.Get(active_user.lang, "Form"), msg: form_lang.Get(active_user.lang, "FormEmpty")} ] });
        return;
    }

    if (isUpdate) {
        json.ID = active_user.session.edits[params.form].ID;
    } else {
        json["user_owner_id"] = active_user.user_id;
    }

    activeInstance.settings.dbTable.AddNewOrUpdateAll(sqlite.db, json, activeInstance.settings.json_where, function(err, err2) {
        if (err) {
            var arr = [];
            arr.push({ control: form_lang.Get(active_user.lang, "Form"), msg : err });
            if (err2) {

                // err2 may contain json with fields, for which there was a problem.
                // it comes from AddNewOrUpdateAll (checking insert for main record)
                for(var field_name in err2) {

                    for(var i in _controls) {
                        var ctrl = _controls[i];
                        if (ctrl.name && (ctrl.name === field_name || (ctrl.details.dbName && ctrl.details.dbName === field_name))) {
                            field_name = form_lang.Get(active_user.lang, ctrl.details.label);
                            break;
                        }
                    }
                    arr.push( {control: field_name, msg: err} );
                }
                if (!arr.length) arr = false;;
            }
            server.sendCallBack(env, {arr: arr});
        } else {
            server.sendCallBack(env, {arr: false});
        }
    });
};


methods.getTableData = function(env, params) {

    datatables.render(env.SessionID, params.dt, function(err, str) {
        server.sendCallBack(env, str);
    });
};

// getting the form in async way
methods.getForm = function(env, params) {

    var active_user = checkUser(env);
    if (!active_user)
        return;

    active_user.checkHostingPlan.CanAddRecord(params.form, function(err) {
        if (err) {
            server.sendCallBack(env, {err : err } );
        } else {
            var ret = forms.renderForm(env.SessionID, params.form, true);
            server.sendCallBack(env, {err : false, html : ret.html, js : ret.js } );
        }
    });
};



methods.removeFromTableData = function(env, params) {

    datatables.remove(env.SessionID, params.dt, params.ids, function(err) {
        server.sendCallBack(env, {err : err });
    });
};

// called when user clicked Apply on the form
methods.editTableData = function(env, params) {

    datatables.edit(env.SessionID, params.dt, params.id, function(err, url) {
        server.sendCallBack(env, {err : err, url : url});
    });
};

methods.logout = function(env, params) {

    _active_user.clearUser(env.SessionID);
    server.sendCallBack(env, {err : false} );
};


// async way for getting forms' controls' values (e.g. for combo)
methods.getControlsValues = function(env, params) {

    var active_user = checkUser(env);

    var activeForm = active_user.session.forms[params.form];
    var activeInstance = activeForm.activeInstance;

    var found = false;
    for(var a in activeInstance.controls) {
        if (activeInstance.controls[a].name && activeInstance.controls[a].name === params.control && activeInstance.controls[a].dynamicValues) {
            found = true;
            activeInstance.controls[a].dynamicValues(active_user, function(err, ret) {
                server.sendCallBack(env, {err : false, values : ret, control : params.control } );
            });
        }
    }

    if (!found) {
        server.sendCallBack(env, {err : "Dynamic values loading method not found for field " + params.control  } );
    }
};


module.exports = methods;