var form_lang = require('../definitions/form_lang');

exports.begin = '<form class="form-horizontal">';

var getData = function(label, _title, input_id, lang, options) {
    var ret = { prefix : "", description: ""};
    if (!options) {
        return ret;
    }

    var desc = form_lang.Get(lang, label + "_Description");

    ret.description = !desc?options.description:desc;
    ret.prefix = options.prefix || "";
    ret.required = options.required;

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

    _value = _value || "";
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
    if(!options.multiline)
        _html += '<input id="a'+id+'" class="form-control" placeholder="'+_title+'" type="'+_type+'" value="'+_value+'" />';
    else{
        var _rows = options.rows ? options.rows:5;
        _html += '<textarea id="a'+id+'" class="form-control" placeholder="'+_title+'" rows="'+_rows+'">'+_value+'</textarea>';
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

    var _js = "window.jxForms[_form_name].controls['a" + id+"'] = {type:'select', required:"+data.required+", name:'"+_title+"', _t:'"+input_id+"'  };";

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

    _html += '<input id="a'+id+'" class="checkbox style-0" type="'+_type+'" '+_value+' />';

    _html += '<span>&nbsp;</span></label></div>';

    if(data.description)
        _html += '<p class="note">'+data.description+'</p>';

    _html +=
        '</div></div>';

    var _js = "window.jxForms[_form_name].controls['a" + id+"'] = {type:'"+_type+"', required:"+data.required+", name:'"+_title+"', _t:'"+input_id+"'  };";

    return {html:_html, js:_js};
};


exports.end = "</fieldset></form>";
