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
        },
        {
            name: "person_cat",
            //val: tool.createComboBox("Category", "Category", "person_cat", "Customer", lang, ["Administrator", "Customer"])
            val: tool.createComboBox("Category", "Category", "person_cat", "", lang, ["Administrator", "Customer"])
        },
        {
            name: "person_desc",
            val: tool.createTextArea("Description", "Description", "person_desc", "some text", lang)
//            val: tool.createTextArea("Description", "Description", "person_desc", null, lang)
        },
        {
            name: "person_fruits",
            val: tool.createCheckList("Favourite Fruits", "Favourite Fruits", "person_fruits", "banana,mango", lang, ["mango", "apple", "banana", "kiwi"])
//            val: tool.createCheckList("Favourite Fruits", "Favourite Fruits", "person_fruits", null, lang, ["mango", "apple", "banana", "kiwi"])
        },
        {
            name: "person_tech",
            val: tool.createTags("Known technologies", "Known technologies", "person_tech", "html,javascript", lang, ["css", "html", "jquery", "php", "nodejs"])
//            val: tool.createTags("Known technologies", "Known technologies", "person_tech", null, lang, ["css", "html", "jquery", "php", "nodejs"])
        },
        {
            name: "person_birthday",
            val: tool.createComboDate("Day of birth", "Day of birth", "person_birthday", "2014-07-11", lang, "YYYY-MM-DD")
//            val: tool.createComboDate("Day of birth", "Day of birth", "person_birthday", null, lang, "YYYY-MM-DD")
        }

    ]; // datetime

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