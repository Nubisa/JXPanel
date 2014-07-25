var tool = require('./form_tools');
var _active_user = require('../definitions/active_user');
var form_lang = require('../definitions/form_lang');
var fs = require("fs");
var path = require("path");
var rep = require('./smart_search').replace;


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

    // empty form template, without controls
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

    var edits = null;
    // copying values for edit form
    if (active_user.session.edits && active_user.session.edits[formName]) {
        edits = {};
        for(var i in active_user.session.edits[formName])
            edits[i] = active_user.session.edits[formName][i];
    }
//    console.log("EDIT", edits);

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

        var val = null;

        if(ctrl.options) {
            ctrl.options.extra = { formName : formName, isUpdate : !!edits };
            if (ctrl.options.password && edits)
                val = null;
        }
//        console.error("val for", dbname, ":", val);
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
    return { html: tool.begin + html + tool.end, js : scr };
};