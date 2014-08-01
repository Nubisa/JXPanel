var tool = require('./form_tools');
var _active_user = require('../definitions/active_user');
var form_lang = require('../definitions/form_lang');
var fs = require("fs");
var path = require("path");
var rep = require('./smart_search').replace;
var database = require("./../install/database");
var site_defaults = require("./../definitions/site_defaults");

var logic = [
    {from:"{{label.$$}}", to:"$$", "$":function(val, gl){
        var active_user = gl.active_user;
        var res = form_lang.Get(active_user.lang, val);
        return !res?"":res;}
    },
    {from:"{{form.##}}", to:"##", "#":function(val, gl){
        if(val == "id")
            return gl.name;

        if (val == "onSubmitSuccess")
            return gl.form.onSubmitSuccess || "";

        if (val == "onSubmitCancel")
            return gl.form.onSubmitCancel || "";

        return form_lang.Get(gl.lang, gl[val], true);
    }}
];


exports.renderForm = function(sessionId, formName, onlyControls){
    var html = "";
    var active_user = _active_user.getUser(sessionId);

    var lang = active_user.lang;
    if(!active_user.session.forms[formName])
        active_user.session.forms[formName] = {};

    var activeForm = require('../definitions/forms/' + formName).form();
    active_user.session.forms[formName].activeInstance = activeForm;

    // empty form template, without controls (used when calling html file for the first time)
    // it returns just a string
    if (!onlyControls) {
        var containerFile = path.join(__dirname, "../definitions/forms/container.html");

        if (!fs.existsSync(containerFile)) {
            return form_lang.Get(active_user.lang, "NoTemplate", null, [ "form" ]);
        }

        var widget = fs.readFileSync(containerFile).toString();
        var _icon = (!activeForm.icon)? "": activeForm.icon;
        logic.globals = { name: formName, contents: "", active_user:active_user, icon:_icon, form: activeForm, lang:active_user.lang};
        var result = rep(widget, logic);

        return result;
    }

    // the rest of the code should return object { err, html, js }
    // this part returns controls, after the template was loaded into the browser and called jxcore.Call('getForm')
    var accessDeniedError = function(noun, name) {
        var noun = form_lang.Get(active_user.lang, noun, true);
        return {err : form_lang.Get(active_user.lang, "AccessDeniedToEditRecord", null, [ noun, name ] ) };
    };

    var isUpdate = null;
    var values = null;

    if (formName === "jxconfig") {
        isUpdate = { record : database.getConfig()};
    } else
    if (_active_user.isRecordUpdating(active_user, formName)) {
        isUpdate = {};
        isUpdate.name = active_user.session.edits[formName].ID;
        values = null;

        if (formName === "addUser") {
            if (!database.isOwnerOfUser(active_user.username, isUpdate.name) && active_user.username !== isUpdate.name)
                return accessDeniedError("user", isUpdate.name);

            values = database.getUser(isUpdate.name);
        } else
        if (formName === "addPlan") {
            if (!database.isOwnerOfPlan(active_user.username, isUpdate.name))
                return accessDeniedError("plan", isUpdate.name);

            values = database.getPlan(isUpdate.name);
        } else
        if (formName === "addDomain") {
            if (!database.isOwnerOfDomain(active_user.username, isUpdate.name))
                return accessDeniedError("domain", isUpdate.name);

            values = database.getDomain(isUpdate.name);
        } else
            return {err : form_lang.Get(active_user.lang, "UnknownForm") };
    }



    if (formName === "addPlan") {

        if (!isUpdate) {
            // getting owner of the plan
            var me = database.getUser(active_user.username);
            if (!me)
                return { err : "DBCannotGetUser" };

            if (me.plan !== "Unlimited") {
                var parentPlan = database.getPlan(me.plan);
                if (!parentPlan)
                    return { err : "DBCannotGetPlan" };

                values = { planMaximums : {} };
                for(var o in parentPlan.planMaximums) {
                    if (!values.planMaximums[o] || values.planMaximums[o] > parentPlan.planMaximums[o])
                        values.planMaximums[o] = parentPlan.planMaximums[o];
                }
                values.maxUserCount = parentPlan.maxUserCount;
                values.maxDomainCount = parentPlan.maxDomainCount;
            }
        }

        if (values && values.planMaximums) {
            // copying values for easier display to the form
            for(var o in values.planMaximums) {
                // this is integer, not a string
                var v = values.planMaximums[o];
                values[o] = v === site_defaults.defaultMaximum ? "" : v;
            }
        }
    }

    var controls = activeForm.controls;

    var arr = [];
    for(var i in controls) {

        if(controls[i].BEGIN != undefined){
            arr.push({html:tool.startFieldSet(), js:""});
            if(controls[i].BEGIN){
                arr.push(tool.createLegend( form_lang.Get(active_user.lang, controls[i].BEGIN, true) ));
            }
            continue;
        }

        if(controls[i].END != undefined){
            arr.push({html:tool.endFieldSet(), js:""});
            continue;
        }

        var name = controls[i].name;
        var ctrl = controls[i].details;
        if (!ctrl.method)
            continue;

        ctrl.options = ctrl.options || {};

        var dbname = ctrl.dbName ? ctrl.dbName : name;
//        var val = isUpdate && isUpdate.record[dbname] ? isUpdate.record[dbname] : null;
        var val = values && values[dbname] || null;

        ctrl.options.extra = { formName : formName, isUpdate : isUpdate, active_user : active_user};
        if (ctrl.options.password && isUpdate)
            val = null;

        if (isUpdate && (ctrl.cannotEdit || (ctrl.cannotEditOwnRecord && values["name"] === active_user.username)))
            ctrl.options.extra.noEditDisplayValue = val;

        if (ctrl.getValue && typeof ctrl.getValue === "function") {
            ctrl.options.extra.noEditDisplayValue = ctrl.getValue(active_user);
        }

        arr.push(ctrl.method(ctrl.label, ctrl.title || ctrl.label, name, val, lang, ctrl.options));
    }

    for(var o in arr)
        html += arr[o].html;

    var scr = "{ var _form_name='"+formName+"';";

    for(var o in arr)
    {
        scr += arr[o].js;
    }

    scr += "}; window.jxForms['"+formName+"'].created = true;";


//    var includeHtmlFile = path.join(__dirname, "../definitions/forms/" + formName + "_include.html");
//    var includeHtml = fs.existsSync(includeHtmlFile) ? fs.readFileSync(includeHtmlFile).toString() : "";
//
//    var includeHtmlJS = path.join(__dirname, "../definitions/forms/" + formName + "_include.js");
//    var includeJS = fs.existsSync(includeHtmlJS) ? fs.readFileSync(includeHtmlJS).toString() : "";

    return { err : false, html: tool.begin + html + tool.end, js : scr };
};