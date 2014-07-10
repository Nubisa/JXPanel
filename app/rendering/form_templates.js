var tool = require('./form_tools');
var _active_user = require('../definitions/active_user');

exports.addUser = function(sessionId){
    var lang = _active_user.getUser(sessionId).lang;

    var formName = "addUser";

    var controls = [
        {
            name: "person_name",
            val: tool.createTextBox("Name", "Name", "person_name", null, lang)
        },
        {
            name: "person_surname",
            val: tool.createTextBox("Surname", "Surname", "person_surname", null, lang)
        }
    ];

    return renderFinal(formName, controls);
};

var renderFinal = function(formName, controls){
    var html = "";

    for(var o in controls)
        html += controls[o].val.html;

    var scr = "";

    for(var o in controls){
        scr += "{var _this = {form:'"+ formName +"', name:'" + controls[o].name +"'};";
        scr += controls[o].val.js;
        scr += "}";
    }

    var final = tool.begin + html + tool.end + "<script>window.renderForms.push(function() {"+scr+"});</script>";

    return final;
};