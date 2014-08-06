var form_lang = require('../definitions/form_lang');
var path = require("path");
var fs = require("fs");

exports.begin = '<form class="form-horizontal">';

var getData = function(label, _title, input_id, lang, options) {
    var ret = { prefix : "", description: ""};
    if (!options) {
        return ret;
    }

    var desc = form_lang.Get(lang, label + "_Description");

    ret.description = !desc?options.description:desc;
    ret.prefix = options.prefix || "";

    var isUpdate = options.extra && options.extra.isUpdate;

    ret.required = options.required || (options.required_insert && !options.extra.isUpdate);
    ret.dynamic = options.dynamic || "";

    if (options.extra && options.extra.noEditDisplayValue)
        ret.value = options.extra.noEditDisplayValue;

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


exports.createTextBox = function(label, _title, input_id, _value, lang, options){

    var data = getData(label, _title, input_id, lang, options);

    _value = _value || options.default || "";
    _title = form_lang.Get(lang, _title) || _title;
    label = form_lang.Get(lang, label) || label;

    var _type = "text";
    if(options.password)
        _type = "password";
    else if(options.multiline){
        _type = "textarea";
    }

    var req_label = "";
    if(data.required){
        req_label = "&nbsp;<span style='color:red;'>*</span>";
    }
    else
        req_label = "&nbsp;<span style='color:red;'>&nbsp;</span>";

    var _html = '<div class="form-group">'
        +'<label class="col-md-2 control-label">'+label + req_label + '</label>'
        +'<div class="col-md-10">';

    var id = jxcore.utils.uniqueId();

    if (options && options.extra && options.extra.noEditDisplayValue) {
        var v = '<div style="margin-top: 7px;">' + options.extra.noEditDisplayValue + '</div>';
        return {html: _html + v + "</div></div>", js: ""};
    }

    if(!options.multiline)
        _html += '<input id="a'+id+'" class="form-control" autocomplete="off" placeholder="'+_title+'" type="'+_type+'" value="'+_value+'" />';
    else{
        var _rows = options.rows ? options.rows:5;
        _html += '<textarea id="a'+id+'" class="form-control" autocomplete="off" placeholder="'+_title+'" rows="'+_rows+'">'+_value+'</textarea>';
    }

    if(data.description)
        _html += '<p class="note">'+data.description+'</p>';

    _html +=
         '</div>'
        +'</div>';

    var _js = "window.jxForms[_form_name].controls['a" + id + "'] = {type:'"+_type+"', required:"+data.required+", name:'"+_title+"', _t:'"+input_id+"' };";

    return {html:_html, js:_js};
};

exports.createComboBox = function(label, _title, input_id, _value, lang, options){

    var data = getData(label, _title, input_id, lang, options);

    _title = form_lang.Get(lang, _title) || _title;
    label = form_lang.Get(lang, label) || label;

    var req_label = "";
    if(data.required){
        req_label = "&nbsp;<span style='color:red;'>*</span>";
    }
    else
        req_label = "&nbsp;<span style='color:red;'>&nbsp;</span>";

    var _html = '<div class="form-group">'
        +'<label class="col-md-2 control-label">'+label + req_label + '</label>'
        +'<div class="col-md-10">';

    var id = jxcore.utils.uniqueId();

    if (options && options.extra && options.extra.noEditDisplayValue) {
        var v = '<div style="margin-top: 7px;">' + options.extra.noEditDisplayValue + '</div>';
        return {html: _html + v + "</div></div>", js: ""};
    }

    _html += '<select class="form-control" id="a'+id+'"><option>'+form_lang.Get(lang, "ComboNotSelected")+'</option>';

    if(options && options.values){
        for(var o in options.values){
            var str = "value='"+options.values[o]+"' ";
            if(_value && _value.trim().length){
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

    // comparing to true is important
    var dynamic = data.dynamic === true ? "'" + (_value || "") + "'" : null;
    var _js = "window.jxForms[_form_name].controls['a" + id+"'] = {type:'select', required:"+data.required+", name:'"+_title+"', _t:'"+input_id+"', dynamic: "+ dynamic  +" };";

    return {html:_html, js:_js};
};

// <input type="checkbox" class="checkbox style-0" checked="checked">
exports.createCheckBox = function(label, _title, input_id, _value, lang, options){

    var data = getData(label, _title, input_id, lang, options);

    _value = !_value?  "" : "checked='checked'";
    _title = form_lang.Get(lang, _title) || _title;
    label = form_lang.Get(lang, label) || label;

    var _type = "checkbox";

    var req_label = "";
    if(data.required){
        req_label = "&nbsp;<span style='color:red;'>*</span>";
    }
    else
        req_label = "&nbsp;<span style='color:red;'>&nbsp;</span>";


    var _html = '<div class="form-group">'
        + '<label class="col-md-2 control-label">'+label + req_label + '</label><div class="col-md-10">'
        + '<div class="checkbox"><label>';

    var id = jxcore.utils.uniqueId();

    if (options && options.extra && options.extra.noEditDisplayValue) {
        var v = '<div style="margin-top: 7px;">' + options.extra.noEditDisplayValue + '</div>';
        return {html: _html + v + "</div></div>", js: ""};
    }


    _html += '<input id="a'+id+'" class="checkbox style-0" type="'+_type+'" '+_value+' />';

    _html += '<span>&nbsp;</span></label></div>';

    if(data.description)
        _html += '<p class="note">'+data.description+'</p>';

    _html +=
        '</div></div>';

    var _js = "window.jxForms[_form_name].controls['a" + id+"'] = {type:'"+_type+"', required:"+data.required+", name:'"+_title+"', _t:'"+input_id+"' };";

    return {html:_html, js:_js};
};


exports.createHidden = function(label, _title, input_id, _value, lang, options){
    var data = getData(label, _title, input_id, lang, options);

    _value = _value || "";
    _title = form_lang.Get(lang, _title) || _title;

    var _type = "hidden";
    var id = jxcore.utils.uniqueId();

    var _html = '<input id="a'+id+'" class="checkbox style-0" type="'+_type+'" '+_value+' />';
    var _js = "window.jxForms[_form_name].controls['a" + id+"'] = {type:'"+_type+"', required:"+data.required+", name:'"+_title+"', _t:'"+input_id+"' };";

    return {html:_html, js:_js};
};


exports.createSimpleText = function(label, _title, input_id, _value, lang, options){
    var data = getData(label, _title, input_id, lang, options);

    _value = _value || data.value || "";
    _title = form_lang.Get(lang, _title) || _title;
    label = form_lang.Get(lang, label) || label;

    var id = jxcore.utils.uniqueId();

    var _html = '<div class="form-group">'
        +'<label class="col-md-2 control-label">'+label + '</label>'
        +'<div class="col-md-10">'
        +'<div style="margin-top: 7px;">' + _value + '</div>'
        +'</div></div>';

    var js = "";

    return {html: _html, js: js};
};

exports.end = "</fieldset></form>";


var formLabels = {};

// returns english labels for form controls,
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


exports.getFieldDisplayNames = function(lang, field_names) {

    if (!field_names) {
        return "";
    }

    var labels = exports.getFormsLabels(lang);
    var arr = [];

    if (field_names.trim) {
        field_names = [ field_names ];
    }
    for(var o in field_names) {
        if (labels[field_names[o]])
            arr[o] = labels[field_names[o]];
        else
            arr[o] = field_names[o];
    }

    return arr.join(", ");
};