var tool = require('./form_tools');

exports.addUser = function(){

    var formName = "addUser";

    var controls = [
        {
            name: "person_name",
            val: tool.createTextBox("Name", "Name", "person_name", null)
        },
        {
            name: "person_surname",
            val: tool.createTextBox("Surname", "Surname", "person_surname", null)
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