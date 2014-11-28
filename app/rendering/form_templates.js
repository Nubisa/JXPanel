var tool = require('./form_tools');
var _active_user = require('../definitions/active_user');
var form_lang = require('../definitions/form_lang');
var fs = require("fs");
var path = require("path");
var rep = require('./smart_search').replace;
var database = require("./../install/database");
var site_defaults = require("./../definitions/site_defaults");
var page_utils = require("./page_utils");
var addons_tools = require("../addons_tools");
var validations = require("./../definitions/validations");
var tools = require("./form_tools");

var logic = [
    {from:"{{label.$$}}", to:"$$", "$":function(val, gl){
        var active_user = gl.active_user;
        var res = form_lang.Get(active_user.lang, val);
        return !res?"":res;}
    },
    {from:"{{form.##}}", to:"##", "#":function(val, gl){
        if(val == "id")
            return gl.name;

        if(val == "displayName") {
            var isUpdate = _active_user.isRecordUpdating(gl.active_user, gl.name);
            var labelAdd = gl.form.displayNameLabel_Add ? gl.form.displayNameLabel_Add : gl.name;
            var labelEdit = gl.form.displayNameLabel_Edit ? gl.form.displayNameLabel_Edit : gl.name;

            return form_lang.Get(gl.lang, isUpdate ? labelEdit : labelAdd);
        }

        if (val == "onSubmitSuccess")
            return gl.form.onSubmitSuccess || "";

        if (val == "onSubmitCancel")
            return gl.form.onSubmitCancel || "";

        if (val == "submitOnClick")
            return gl.form.submitOnClick || "window.jxForms['"+ gl.name +"'].apply()";


        return form_lang.Get(gl.lang, gl[val], true);
    }}
];

exports.getClientFormScript = function(formName) {
    var containerFilejs = path.join(__dirname, "../definitions/forms/container_js.html");
    var str = fs.existsSync(containerFilejs) ? fs.readFileSync(containerFilejs).toString() : "";

    if (formName) {
        var containerFilejs = path.join(__dirname, "../definitions/forms/" + formName + "_js.html");
        if (fs.existsSync(containerFilejs))
            str += fs.readFileSync(containerFilejs).toString();
    }
    return str;
};


var addMaximumsFromAddons = function(activeFormInstance) {

    if (activeFormInstance.addonsCriteriaAdded)
        return;

    var ret = addons_tools.callEvent("hostingPlanCriteria");
    if (ret) {
        var newControls = [];
        for (var addon_name in ret) {
            newControls.push({ BEGIN : addon_name, tab : 1, addon : addon_name });

            for(var i in ret[addon_name]) {
                var addon_control = ret[addon_name][i];
                if (!addon_control.id) continue;

                var method = tools.getMethod(addon_control.type);
                if (!method)
                    continue;

                var options = addon_control.options;
                if (!options) options = { };
                options.extra = options.extra || {};
                options.extra.formName = activeFormInstance.name;

                var ctrl = {
                    name : addon_name + "@" + addon_control.id,
                    details : {
                        label : options.label,
                        options : options,
                        method : method,
                        definesMax: true
                    },
                    addon : addon_name,
                    validation : validations.getValidationByObject(options.validation)
                }

                newControls.push(ctrl);
            }

            newControls.push({ END : 1, addon : addon_name  });
        }
    }

    for(var o in newControls)
        activeFormInstance.controls.push(newControls[o]);

    activeFormInstance.addonsCriteriaAdded = true;
};

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

        var widget = exports.getClientFormScript(formName) + fs.readFileSync(containerFile).toString();
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

    var accessDeniedError0 = {err : form_lang.Get(active_user.lang, "AccessDenied",  true) };

    var isUpdate = null;
    var values = null;

    if (formName === "jxconfig" || formName === "jxconfigLoginPage") {
        if (!_active_user.isAdmin(active_user))
            return accessDeniedError0;
        isUpdate = { };
        values = database.getConfig();
    } else
    if (formName.slice(0,3) === "app") {
        isUpdate = {};
        var domain_name = _active_user.isRecordUpdating(active_user, formName);
        if (!domain_name)
            return accessDeniedError0;

    } else
    if (_active_user.isRecordUpdating(active_user, formName)) {
        isUpdate = {};
        isUpdate.name = active_user.session.edits[formName].ID;
        var dbValues = null;

        if (formName === "addUser") {
            if (!database.isOwnerOfUser(active_user.username, isUpdate.name) && active_user.username !== isUpdate.name)
                return accessDeniedError("user", isUpdate.name);

            dbValues = database.getUser(isUpdate.name);
        } else
        if (formName === "addPlan") {
            if (!database.isOwnerOfPlan(active_user.username, isUpdate.name))
                return accessDeniedError("plan", isUpdate.name);

            dbValues = database.getPlan(isUpdate.name);
        } else
        if (formName === "addDomain") {
            if (!database.isOwnerOfDomain(active_user.username, isUpdate.name))
                return accessDeniedError("domain", isUpdate.name);

            dbValues = database.getDomain(isUpdate.name);
        } else
            return {err : form_lang.Get(active_user.lang, "UnknownForm") };


        values = JSON.parse(JSON.stringify(dbValues));
    }



    if (formName === "addPlan") {

        addMaximumsFromAddons(activeForm);

        if (!isUpdate) {
            // getting owner of the plan
            var me = database.getUser(active_user.username);
            if (!me)
                return { err : "DBCannotGetUser" };

            if (me.plan !== database.unlimitedPlanName) {
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
                values[o] = v === database.defaultMaximum ? "" : v;
            }
        }
    }

    var controls = activeForm.controls;

    var tabId = 0;
    var tabs = [];
    if (activeForm.tabs && activeForm.tabs.length) {
        tabs = JSON.parse(JSON.stringify(activeForm.tabs));
        for(var i in tabs) {
            tabs[i].arr = [];
            if (!tabs[i].id)
                tabs[i].id = "formTab" + i;
            if (tabs[i].label)
                tabs[i].label = form_lang.Get(active_user.lang, tabs[i].label, true);
        }
    } else {
        tabs[0] = { arr : []};
    }

    var arr = tabs[0].arr;
    var skip = false;
    for(var i in controls) {

        skip = (isUpdate && controls[i].OnEdit === false) || (!isUpdate && controls[i].OnInsert === false);

        if(controls[i].END != undefined){
            arr.push({html:tool.endFieldSet(), js:""});
            skip = false;
            continue;
        }

        if (skip) continue;

        if(controls[i].BEGIN != undefined){
            var _tabId = parseInt(controls[i].tab);
            tabId = isNaN(_tabId) ? 0 : _tabId;
            arr = tabs[tabId].arr;

            arr.push({html:tool.startFieldSet(), js:""});
            if(controls[i].BEGIN){
                arr.push(tool.createLegend( form_lang.Get(active_user.lang, controls[i].BEGIN, true) ));
            }
            continue;
        }

        if(controls[i].INFO != undefined){
            var str = (controls[i].prefix || "") + form_lang.Get(active_user.lang, controls[i].INFO, true) + (controls[i].suffix || "");
            arr.push(tool.createSimpleText(" ", null, null, str, active_user, {}));
            continue;
        }


        var name = controls[i].name;
        var ctrl = controls[i].details;
        if (!ctrl.method)
            continue;

        if (controls[i].visibility && !controls[i].visibility(active_user, values, formName))
            continue;

        ctrl.options = ctrl.options || {};

        var dbname = ctrl.dbName ? ctrl.dbName : name;
        var val = (values && (values[dbname] || values[dbname] === 0 || values[dbname] === false)) ? values[dbname] : null;
        // if we'll check against !val
        if (val === 0) val = "0";
        if (typeof val === "string") val = val.replace(/"/g, "&quot;");

        ctrl.options.extra = { formName : formName, isUpdate : isUpdate };
        if (ctrl.options.password && isUpdate)
            val = null;

        if (isUpdate && (ctrl.cannotEdit || ctrl.method === tool.createSimpleText || (ctrl.cannotEditOwnRecord && values["name"] === active_user.username))) {
            if (ctrl.getValue && typeof ctrl.getValue === "function") {
                val = ctrl.getValue(active_user, values, false);
            }
            ctrl.options.extra.noEditDisplayValue = val;
        }

        if (!isUpdate && ctrl.cannotInsert) {
            if (ctrl.getValue && typeof ctrl.getValue === "function") {
                val = null; //ctrl.getValue(active_user, values);
            }
            ctrl.options.extra.noEditDisplayValue = form_lang.Get(active_user.lang, "ValueOnlyForEdit", true);
        }

        if (isUpdate && ctrl.hideOnEdit)
            continue;

        if (ctrl.getDescription && typeof ctrl.getDescription === "function") {
            ctrl.options.extra.description = ctrl.getDescription(active_user, values, formName);
        }

        if (ctrl.getValuesList)
            ctrl.options.values = ctrl.getValuesList(active_user, values, false);

//        if (!isUpdate && active_user.username=== "nubisa" && formName==="addUser") {
//            if (name === "person_name") val = "kris2";
//            if (name === "person_username") val = "kris2";
//            if (name === "person_password") val = "pokein2013";
//            if (name === "person_repeat_password") val = "pokein2013";
//            if (name === "person_email") val = "x@x.x";
//            if (name === "plan_table_id") val = "for kris";
//        }

        arr.push(ctrl.method(ctrl.label, ctrl.title || ctrl.label, name, val, active_user, ctrl.options));
    }

    var scr = "{ var _form_name='"+formName+"';";

    var realTabCount = 0;
    for(var a in tabs) {
        tabs[a].contents = "";
        var arr = tabs[a].arr;
        for(var o in arr) {
            tabs[a].contents += arr[o].html;
            html += arr[o].html;
            scr += arr[o].js;
        }
        if (tabs[a].contents)
            realTabCount++;
        if (tabs[a].showAlways)
            realTabCount = 999;
    }

    if (realTabCount > 1)
        html = page_utils.getTabs("formTabs", tabs);

    scr += "}; window.jxForms['"+formName+"'].created = true;";

//    var includeHtmlFile = path.join(__dirname, "../definitions/forms/" + formName + "_include.html");
//    var includeHtml = fs.existsSync(includeHtmlFile) ? fs.readFileSync(includeHtmlFile).toString() : "";
//
//    var includeHtmlJS = path.join(__dirname, "../definitions/forms/" + formName + "_include.js");
//    var includeJS = fs.existsSync(includeHtmlJS) ? fs.readFileSync(includeHtmlJS).toString() : "";

    return { err : false, html: tool.begin + html + tool.end + tool.createButtons(active_user, activeForm), js : scr };
};