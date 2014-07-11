var tool = require('./form_tools');
var _active_user = require('../definitions/active_user');
var form_lang = require('../definitions/form_lang');
var forms = require('../definitions/forms');
var fs = require("fs");
var path = require("path");

exports.addUser_Test = function(sessionId){
    var lang = _active_user.getUser(sessionId).lang;

    var formName = "addUser_Test";

    var controls = [
        {
            name: "person_name",
            val: tool.createTextBox("Name", "Name", "person_name", null, lang)
        },
        {
            name: "person_surname",
            val: tool.createTextBox("Surname", "Surname", "person_surname", null, lang)
        },
        {
            name: "person_cat",
            val: tool.createComboBox("Category", "Category", "person_cat", "Customer", lang, { values : ["Administrator", "Customer"] })
        },
        {
            name: "person_desc",
            val: tool.createTextArea("Description", "Description", "person_desc", "some text", lang)
        },
        {
            name: "person_fruits",
            val: tool.createCheckList("Favourite Fruits", "Favourite Fruits", "person_fruits", "banana,mango", lang, { values : ["mango", "apple", "banana", "kiwi"] })
        },
        {
            name: "person_tech",
            val: tool.createTags("Known technologies", "Known technologies", "person_tech", "html,javascript", lang, { values : ["css", "html", "jquery", "php", "nodejs"] } )
        },
        {
            name: "person_birthday",
            val: tool.createComboDate("Day of birth", "Day of birth", "person_birthday", "2014-07-11", lang, { format : "YYYY-MM-DD" })
        }

    ];

    return renderFinal(sessionId, formName, controls);
};

exports.addUser = function(sessionId){
    var lang = _active_user.getUser(sessionId).lang;

    var formName = "addUser";

    if (!forms.forms[formName])
        return form_lang.Get(lang, "UnknownForm");

    var controls = forms.forms[formName].controls;

    var arr = [];
    for(var name in controls) {
        var ctrl = controls[name];
        var json = {
            name: name,
            val: ctrl.method(ctrl.label, ctrl.title || ctrl.label, name, null, lang, ctrl.options)
        };
        arr.push(json);
    }

    return renderFinal(sessionId, formName, arr);
};


var renderFinal = function(sessionId, formName, controls){
    var html = "";

    for(var o in controls)
        html += controls[o].val.html;

    var lang = _active_user.getUser(sessionId).lang;
    var submit = '<br><button class="btn btn-primary" type="button" onclick="jxcore.Call(\'sessionApply\', { form : \'' + formName + '\' }, function (param) { window.jxAddMessage(param.err ? \'danger\' : \'success\', param.err ? param.err : JSON.stringify(param))});">' + form_lang.Get(lang, "Apply") + '</button>';

    var scr = "";

    for(var o in controls){
        scr += "{var _this = {form:'"+ formName +"', name:'" + controls[o].name +"'};";
        scr += controls[o].val.js;
        scr += "}";
    }

    var final = tool.begin + html + tool.end + submit + "<script>window.renderForms.push(function() {"+scr+"});</script>";

    var containerFile = path.join(__dirname, "../definitions/forms/container.html");

    if (fs.existsSync(containerFile)) {
        var widget = fs.readFileSync(containerFile).toString();
        return widget.replace("{{form.contents}}", final).replace("{{form.name}}", formName);
    } else {
        return final;
    }

};