var form_lang = require('../definitions/form_lang');
var page_utils = require('./page_utils');
var path = require("path");
var fs = require("fs");
var database = require("../install/database");

exports.begin = '<form class="form-horizontal" onsubmit="return false;">';

var getData = function(label, _title, input_id, active_user, options) {
    var ret = { prefix : "", description: ""};
    if (!options) {
        return ret;
    }

    var desc = form_lang.Get(active_user.lang, label + "_Description");

    ret.description = options.extra && options.extra.description ? options.extra.description : desc || options.description;
    ret.prefix = options.prefix || "";

    var isUpdate = options.extra && options.extra.isUpdate;

    ret.required = options.required || (options.required_insert && !options.extra.isUpdate);
    ret.required_label = ret.required ? "&nbsp;<span style='color:red;'>*</span>" : "&nbsp;&nbsp;";
    ret.required_class = ret.required ? " required" : "";

    if (options.extra) {

        if (!active_user.session.forms[options.extra.formName].fakeIds) {
            active_user.session.forms[options.extra.formName].fakeIds = {};
            active_user.session.forms[options.extra.formName].fakeIdsReversed = {};
        }

        if (!active_user.session.forms[options.extra.formName].fakeIdsReversed[input_id]) {
            ret.fakeId = "a" + jxcore.utils.uniqueId();

            active_user.session.forms[options.extra.formName].fakeIds[ret.fakeId] = input_id;
            active_user.session.forms[options.extra.formName].fakeIdsReversed[input_id] = ret.fakeId;
        } else {
            ret.fakeId = active_user.session.forms[options.extra.formName].fakeIdsReversed[input_id];
        }

        if (options.extra.noEditDisplayValue)
            ret.value = options.extra.noEditDisplayValue;

    }

    ret.class = "form-group";
    if (options.hidden) ret.class += " hidden";

    return ret;
};


exports.createLegend = function(label){
    return {html:"<legend>"+label+"</legend>", js:""};
};


exports.startFieldSet = function(){
    return "<fieldset>";
};


exports.endFieldSet = function(){
    return "</fieldset>";
};


exports.createTextBox = function(label, _title, input_id, _value, active_user, options){

    var data = getData(label, _title, input_id, active_user, options);

    _value = _value || options.default || "";
    _title = form_lang.Get(active_user.lang, _title) || _title;
    label = form_lang.Get(active_user.lang, label) || label;

    var _type = "text";
    if(options.password)
        _type = "password";
    else if(options.multiline){
        _type = "textarea";
    }

    var _html = '<div class="' + data.class + '" id="' + data.fakeId + '_group">'
        +'<label class="col-md-2 control-label">'+label + data.required_label + '</label>'
        +'<div class="col-md-10">';

    if (options && options.extra && options.extra.noEditDisplayValue) {
        var v = '<div style="margin-top: 7px;">' + options.extra.noEditDisplayValue + '</div>';
        return {html: _html + v + "</div></div>", js: ""};
    }

    if(!options.multiline)
        _html += '<input id="'+data.fakeId+'" class="form-control'+data.required_class+'" autocomplete="off" placeholder="'+_title+'" type="'+_type+'" value="'+_value+'" />';
    else{
        var _rows = options.rows ? options.rows:5;
        _html += '<textarea id="'+data.fakeId+'" class="form-control'+data.required_class+'" autocomplete="off" placeholder="'+_title+'" rows="'+_rows+'">'+_value+'</textarea>';
    }

    if(data.description)
        _html += '<p class="note">'+data.description+'</p>';

    _html +=
         '</div>'
        +'</div>';

//    var _js = "window.jxForms[_form_name].controls['" + data.fakeId + "'] = {type:'"+_type+"', required:"+data.required+", name:'"+_title+"' };";

    return {html:_html, js:""};
};

exports.createComboBox = function(label, _title, input_id, _value, active_user, options){

    var data = getData(label, _title, input_id, active_user, options);

    _value = _value || options.default || "";
    _title = form_lang.Get(active_user.lang, _title) || _title;
    label = form_lang.Get(active_user.lang, label) || label;

    var _html = '<div class="' + data.class + '" id="' + data.fakeId + '_group">'
        +'<label class="col-md-2 control-label">'+label + data.required_label + '</label>'
        +'<div class="col-md-10">';

    if (options && options.extra && options.extra.noEditDisplayValue) {
        var v = '<div style="margin-top: 7px;">' + options.extra.noEditDisplayValue + '</div>';
        return {html: _html + v + "</div></div>", js: ""};
    }

    _html += '<select class="form-control'+data.required_class+'" id="'+data.fakeId+'"><option>'+form_lang.Get(active_user.lang, "ComboNotSelected")+'</option>';

    if(options && options.values){
        for(var o in options.values){
            var str = "value='"+options.values[o]+"' ";
            if(_value && _value.toString().trim().length){
                if(options.values[o] == _value)
                    str += " selected";
            }
            _html += "<option " + str + ">" + options.values[o] + "</option>";
        }
    }

    _html += "</select>";

    if(data.description)
        _html += '<p class="note">'+data.description+'</p>';

    _html +=
        '</div>'
        +'</div>';

//    var _js = "window.jxForms[_form_name].controls['" + data.fakeId+"'] = {type:'select', required:"+data.required+", name:'"+_title+"' };";

    return {html:_html, js:""};
};

// <input type="checkbox" class="checkbox style-0" checked="checked">
exports.createCheckBox = function(label, _title, input_id, _value, active_user, options){

    var data = getData(label, _title, input_id, active_user, options);

    _value = _value || options.default || "";
    _value = !_value?  "" : "checked='checked'";
    _title = form_lang.Get(active_user.lang, _title) || _title;
    label = form_lang.Get(active_user.lang, label) || label;

    var _type = "checkbox";

    var _html = '<div class="' + data.class + '" id="' + data.fakeId + '_group">'
        + '<label class="col-md-2 control-label">'+label + data.required_label + '</label><div class="col-md-10">';

    if (options && options.extra && typeof options.extra.noEditDisplayValue !== "undefined") {
        var v = '<div style="margin-top: 7px;">' + options.extra.noEditDisplayValue + '</div>';
        return {html: _html + v + "</div></div>", js: ""};
    }


    _html += '<div class="checkbox"><label>';
    _html += '<input id="'+data.fakeId+'" class="checkbox style-0'+data.required_class+'" type="'+_type+'" '+_value+' />';

    _html += '<span>&nbsp;</span>';
     if (options && options.checkbox_text) _html += options.checkbox_text;
    _html += '</label></div>';

    if(data.description)
        _html += '<p class="note">'+data.description+'</p>';

    _html +=
        '</div></div>';

//    var _js = "window.jxForms[_form_name].controls['" + data.fakeId+"'] = {type:'"+_type+"', required:"+data.required+", name:'"+_title+"' };";

    return {html:_html, js:"", fakeId : data.fakeId};
};


exports.createHidden = function(label, _title, input_id, _value, active_user, options){
    var data = getData(label, _title, input_id, active_user, options);

    _value = _value || "";
    _title = form_lang.Get(active_user.lang, _title) || _title;

    var _type = "hidden";

    var _html = '<input id="'+data.fakeId+'" class="checkbox style-0" type="'+_type+'" '+_value+' />';
//    var _js = "window.jxForms[_form_name].controls['" + data.fakeId+"'] = {type:'"+_type+"', required:"+data.required+", name:'"+_title+"' };";

    return {html:_html, js:""};
};


exports.createSimpleText = function(label, _title, input_id, _value, active_user, options){
    var data = getData(label, _title, input_id, active_user, options);

    _value = _value || data.value || "";
    _title = form_lang.Get(active_user.lang, _title) || _title;
    label = form_lang.Get(active_user.lang, label) || label;

    var _html = '<div class="' + data.class + '" id="' + data.fakeId + '_group">'
        +'<label class="col-md-2 control-label">'+label + '</label>'
        +'<div class="col-md-10">'
        +'<div style="margin-top: 7px;">' + _value + '</div>'
        + (data.description ? '<p class="note">'+data.description+'</p>' : "")
        +'</div></div>';

    var js = "";

    return {html: _html, js: js};
};


exports.createButtons = function(active_user, formInstance) {

    var str = '<div class="form-group" id="jxform_buttons" style="margin-bottom: 30px; margin-top: 20px;">'
             +'<label class="col-md-2 control-label"></label>'
             +'<div class="col-md-4" style="padding-left: 0px">';

    var buttons = '<button type="submit" onclick="return false;" style="display: none;"></button>'
                 + page_utils.getSingleButton(form_lang.Get(active_user.lang, "Apply", true),
                        "fa-check", formInstance.submitOnClick || "window.jxForms['"+ formInstance.name +"'].apply()", false)
                 + page_utils.getSingleButton(form_lang.Get(active_user.lang, "Cancel", true),
                    "fa-times", "location = '" + formInstance.onSubmitCancel + "';", false);

    str += page_utils.getButtonsGroup(buttons);
    str +=  '</div></div><br><br>';

    return exports.createLegend("").html + str;
};


exports.end = "</fieldset></form>";


var formLabels = {};

// returns translated labels for form controls,
// e.g. { person_name : "Contact name", .... }
exports.getFormsLabels = function(lang) {

    if (!lang) lang = "EN";

    if (formLabels[lang])
        return formLabels[lang];

    var dir = path.join(__dirname, "../definitions/forms");
    var files = fs.readdirSync(dir);


    var labels = {};
    for(var o in files) {
        var file = dir + path.sep + files[o];
        if (path.extname(file) === ".js") {
            try {
                var form = require(file).form();

                for(var i in form.controls) {
                    if (form.controls[i].name) {
                        labels[form.controls[i].name] = form_lang.Get("EN", form.controls[i].details.label, true);

                        if (form.controls[i].details.dbName)
                            labels[form.controls[i].details.dbName] = form_lang.Get("EN", form.controls[i].details.label, true);
                    }
                }

            } catch(ex) {}
        }
    }

    formLabels[lang] = labels;

    return formLabels[lang];
};

// returns comma separated fields's display names and their values
exports.getFieldDisplayNames = function(lang, field_names, field_values) {

    if (!field_names) {
        return "";
    }

    var labels = exports.getFormsLabels(lang);
    var arr = [];

    if (field_names.trim) {
        field_names = [ field_names ];
    }
    for(var o in field_names) {
        var field_name = field_names[o];
        if (labels[field_name])
            arr[o] = labels[field_name];
        else
            arr[o] = field_name;


        if (field_values) {
            var val = "###";
            if (field_values.planMaximums && field_values.planMaximums[field_name])
                val = field_values.planMaximums[field_name];
            else if (field_values[field_name])
                val = field_values[field_name];

            if (val !== "###" && val !== database.defaultMaximum)
                arr[o] += " `" + val  + "`";
        }
    }

    return arr.join(", ");
};


exports.getFormControls = function(activeInstance) {

    if (!activeInstance)
        throw "Instance of the form is empty.";

    var ret = {};
    for(var i in activeInstance.controls) {
        if (activeInstance.controls[i].name)
            ret[activeInstance.controls[i].name] = activeInstance.controls[i];
    }
    return ret;
};


exports.getFieldDisplayValue = function (active_user, activeInstance, field_name, record) {

    if (!activeInstance)
        throw "Instance of the form is empty.";

    var val = record[field_name];

    var controls = exports.getFormControls(activeInstance);

    if (controls[field_name] && controls[field_name].details) {

        if (controls[field_name].details.displayValues) {

            for (var _val in controls[field_name].details.displayValues) {

                // null/undefined value replacement into display value
                var isEmpty = _val === "__EMPTY__" && (val === null || val === undefined || val === "");
                // specific value replacement
                var isEqual = _val + "" === val + "";

                if (isEmpty || isEqual) {
                    var _new_val = controls[field_name].details.displayValues[_val];
                    // if val is something like "@JXcore" , treat it as label from lang definition.
                    if (_new_val.length && _new_val.slice(0, 1) === "@") {
                        _new_val = form_lang.Get(active_user.lang, _new_val.slice(1)) || val;
                    }
                    val = _new_val;
                }
            }
        } else if (controls[field_name].details.getValue) {
            val = controls[field_name].details.getValue(active_user, record, true);
        } else if (controls[field_name].details.method === exports.createCheckBox) {
            val = form_lang.GetBool(active_user.lang, val, "Yes", "No");
        }
    }

    return val;
};
