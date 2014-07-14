var tool = require('./form_tools');
var _active_user = require('../definitions/active_user');
var form_lang = require('../definitions/form_lang');
var fs = require("fs");
var path = require("path");
var rep = require('./smart_search').replace;

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


var logic = [
    {from:"{{label.$$}}", to:"$$", "$":function(val, gl){
        var active_user = gl.active_user;
        var res = form_lang.Get(active_user.lang, val);
        return !res?"":res;}
    },
    {from:"{{form.##}}", to:"##", "#":function(val, gl){
        if(val == "id")
            return gl.name;

        return form_lang.Get(gl.lang, gl[val], true);
    }}
];


exports.renderForm = function(sessionId, formName){
    var html = "";
    var active_user = _active_user.getUser(sessionId);

    var lang = active_user.lang;
    if(!active_user.session.forms[formName])
        active_user.session.forms[formName] = {};

    var activeForm = require('../definitions/forms/' + formName).form();
    active_user.session.forms[formName].activeInstance = activeForm;

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

        arr.push(ctrl.method(ctrl.label, ctrl.title || ctrl.label, name, null, lang, ctrl.options));
    }

    for(var o in arr)
        html += arr[o].html;

    var scr = "{ var _form_name='"+formName+"';";

    for(var o in arr)
    {
        scr += arr[o].js;
    }

    scr += "}";

    var fstr = tool.begin + html + tool.end + "<script>"+scr+"</script>";

    var containerFile = path.join(__dirname, "../definitions/forms/container.html");

    if (fs.existsSync(containerFile)) {
        var widget = fs.readFileSync(containerFile).toString();
        var _icon = (!activeForm.icon)? "": activeForm.icon;
        logic.globals = { name: formName, contents: fstr, active_user:active_user, icon:_icon };
        var result = rep(widget, logic);

        return result;
    } else {
        return fstr;
    }

};