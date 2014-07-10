var form_lang = require('../definitions/form_lang');

exports.begin = ''
    +'<script>if(!window.renderForms){window.renderForms=[function(){$.fn.editable.defaults.mode = "inline";}];};</script>'
    +'<table style="clear: both" class="table table-bordered table-striped" id="user">'
    +'<tbody>';

exports.createTextBox = function(label, _title, input_id, _value, lang){
    if(!_value || !_value.length){
        _value = form_lang.Get(lang, "Empty");
    }
    if(form_lang.Get(lang, _title)){
        _title = form_lang.Get(lang, _title);
    }
    if(form_lang.Get(lang, label)){
        label = form_lang.Get(lang, label);
    }

    var base_input = '<tr>'
        +'<td style="width:35%;">' + label +'</td>'
        +'<td style="width:65%">'
        +'<a data-original-title="'
        + _title
        +'" data-pk="1" data-type="'
        +'text'
        +'" id="'
        + input_id
        +'" href="#" class="editable editable-click">'
        + _value
        +'</a></td></tr>';

    var _validate = function(_value){
        var obj = {form:_this.form, key:_this.name, value:_value};
        jxcore.Call("sessionAdd", obj , function(param){
            alert("CALLBACK:: " + param)
        });
    };

    _validate += ";;;";

    var base_script = "$('#"+input_id+"').editable(" +
        JSON.stringify({
        type: 'text',
        pk: 1,
        name: input_id,
        title: _title,
        validate:_validate
    }) + ");";
    base_script = base_script.replace(new RegExp("\"function", "g"), "function")
        .replace(/\\n/g, " ")
        .replace(/\\t/g, " ")
        .replace(/\\\"/g, "\"")
        .replace(new RegExp("};;;\"", "g"), "}");

    return {html:base_input, js:base_script};
};

exports.end = "</tbody></table>";

