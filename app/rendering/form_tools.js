var form_lang = require('../definitions/form_lang');

exports.begin = ''
    +'<script>if(!window.renderForms){window.renderForms=[function(){$.fn.editable.defaults.mode = "inline";}];};</script>'
    +'<table style="clear: both" class="table table-bordered table-striped" id="user">'
    +'<tbody>';


var getRequiredCheck = function(lang, options) {

    if (options && options.required) {
        return "if ($.trim(_value) == '') return '" + form_lang.Get(lang, "ValueRequired") + "';"
    }

    return "";
};


exports.createTextBox = function(label, _title, input_id, _value, lang, options){

    _valueStr = _value ? _value : "";
    _value = _value || form_lang.Get(lang, "Empty");
    _title = form_lang.Get(lang, _title) || _title;
    label = form_lang.Get(lang, label) || label;

    if (options && options.required) label += ' <span style="color: #b94a48">*</span>';

    var base_input = '<tr>'
        +'<td style="width:35%;">' + label +'</td>'
        +'<td style="width:65%">'
        +'<a data-original-title="'
        + _title
        +'" data-pk="1" data-type="'
        + (options && options.password ? 'password' : 'text')
        +'" data-value="'+ _valueStr +'" id="'
        + input_id
        +'" href="#" class="editable editable-click">'
        + _value
        +'</a></td></tr>';

    var _validate = function(_value){
        /*text*/
        var obj = {form:_this.form, key:_this.name, value:_value};
        jxcore.Call("sessionAdd", obj , function(param){
            alert("CALLBACK:: " + param)
        });
    };

    _validate += ";;;";
    _validate = _validate.replace("_this.name", '"' + input_id + '"');
    _validate = _validate.replace("/*text*/", getRequiredCheck(lang, options));

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


exports.createComboBox = function (label, _title, input_id, _value, lang, options) {

    var _empty = form_lang.Get("EN", "NotSelected") || "not selected";

    var _valueId = ""
    var _valueStr = _empty;

    if (_value && _value.trim() && options && options.values) {
            var pos = options.values.indexOf(_value);
            if (pos > -1) {
                _valueId = _value;
                _valueStr = _value;
            } else {
                _valueStr = _empty;
            }
    }

    _title = form_lang.Get(lang, _title) || _title;
    label = form_lang.Get(lang, label) || label;

    var base_input = '<tr>'
        + '<td style="width:35%;">' + label + '</td>'
        + '<td style="width:65%">'
        + '<a data-original-title="'
        + _title
        + '" data-pk="1" data-type="'
        + 'select'
        + '" id="'
        + input_id
        + '"  data-value="'
        + _valueId
        + '" href="#" class="editable editable-click">'
        + _valueStr
        + '</a></td></tr>\n';

    var _validate = function (_value) {
        var obj = {form: _this.form, key: _this.name, value: _value};
        jxcore.Call("sessionAdd", obj, function (param) {
            alert("CALLBACK:: " + param)
        });
    };

    _validate += ";;;";
    _validate = _validate.replace("_this.name", '"' + input_id + '"');

    var source = [];
    if (options && options.values && options.values.length) {
        for(var id in options.values) {
            var c = parseInt(id) + 1;
            source.push( { value: options.values[id], text: options.values[id]} )
        }
    }

    var base_script = "$('#" + input_id + "').editable(" +
        JSON.stringify(

            { prepend: _empty,
                source: source,
                display: function (value, sourceData) {
                    var colors = {
                        "": "gray",
                        1: "green",
                        2: "blue"
                    }, elem = $.grep(sourceData, function (o) {
                        return o.value == value;
                    });

                    if (elem.length) {
                        $(this).text(elem[0].text).css("color", colors[value]);
                    } else {
                        $(this).empty();
                    }
                },

                pk: 1,
                name: input_id,
                title: _title,
                validate: _validate
            }
        ) + ");";
    base_script = base_script.replace(new RegExp("\"function", "g"), "function")
        .replace(/\\n/g, " ")
        .replace(/\\t/g, " ")
        .replace(/\\\"/g, "\"")
        .replace(new RegExp("};;;\"", "g"), "}");

    return {html: base_input, js: base_script};
};

exports.createTextArea = function(label, _title, input_id, _value, lang, options){

    _valueStr = _value ? _value : "";
    _value = _value || form_lang.Get(lang, "Empty");
    _title = form_lang.Get(lang, _title) || _title;
    label = form_lang.Get(lang, label) || label;

    var base_input = '<tr>'
        +'<td style="width:35%;">' + label +'</td>'
        +'<td style="width:65%">'
        +'<a data-original-title="'
        + _title
        +'" data-pk="1" data-type="'
        +'textarea'
        +'" data-value="'+ _valueStr +'" id="'
        + input_id
        +'" href="#" class="editable editable-pre-wrapped editable-click">'
        + _value
        +'</a></td></tr>';

    var _validate = function(_value){
        /*text*/
        var obj = {form:_this.form, key:_this.name, value:_value};
        jxcore.Call("sessionAdd", obj , function(param){
            alert("CALLBACK:: " + param)
        });
    };

    _validate += ";;;";
    _validate = _validate.replace("_this.name", '"' + input_id + '"');
    _validate = _validate.replace("/*text*/", getRequiredCheck(lang, options));

    var base_script = "$('#"+input_id+"').editable(" +
        JSON.stringify({
            showbuttons: 'bottom',
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

exports.createCheckList = function (label, _title, input_id, _value, lang, options) {

    var _empty = form_lang.Get("EN", "NotSelected") || "not selected";
    var _arrStr = [];

    if (_value && _value.trim() && options && options.values) {
        var arr = _value.split(",");

        for(var a in arr) {
            var pos = options.values.indexOf(arr[a]);
            if (pos > -1) {
                _arrStr.push(arr[a]);
            }
        }
    }

    var _valueIDs = "";
    var _valueStr = _empty;
    if (_arrStr.length) {
        _valueIDs = _arrStr.join(",");
        _valueStr = _arrStr.join("<br>");
    }

    _title = form_lang.Get(lang, _title) || _title;
    label = form_lang.Get(lang, label) || label;

    var base_input = '<tr>'
        + '<td style="width:35%;">' + label + '</td>'
        + '<td style="width:65%">'
        + '<a data-original-title="'
        + _title
        + '" data-pk="1" data-type="'
        + 'checklist'
        + '" id="'
        + input_id
        + '"  data-value="'
        + _valueIDs
        + '" href="#" class="editable editable-click">'
        + _valueStr
        + '</a></td></tr>\n';

    var _validate = function (_value) {
        var obj = {form: _this.form, key: _this.name, value: _value};
        jxcore.Call("sessionAdd", obj, function (param) {
            alert("CALLBACK:: " + param)
        });
    };

    _validate += ";;;";
    _validate = _validate.replace("_this.name", '"' + input_id + '"');

    var source = [];
    if (options && options.values && options.values.length) {
        for(var id in options.values) {
            var c = parseInt(id) + 1;
            source.push( { value: options.values[id], text: options.values[id]} )
        }
    }

    var base_script = "$('#" + input_id + "').editable(" +
        JSON.stringify(
            {
                source: source,
                pk: 1,
                name: input_id,
                title: _title,
                validate: _validate
            }
        ) + ");";
    base_script = base_script.replace(new RegExp("\"function", "g"), "function")
        .replace(/\\n/g, " ")
        .replace(/\\t/g, " ")
        .replace(/\\\"/g, "\"")
        .replace(new RegExp("};;;\"", "g"), "}");

    return {html: base_input, js: base_script};
};


exports.createTags = function (label, _title, input_id, _value, lang, options) {

    var _empty = form_lang.Get("EN", "NotSelected") || "not selected";
    var _arrStr = [];

    if (_value && _value.trim() && options && options.values) {
        var arr = _value.split(",");

        for(var a in arr) {
            var pos = options.values.indexOf(arr[a]);
            if (pos > -1) {
                _arrStr.push(arr[a]);
            }
        }
    }

    var _valueIds = "";
    var _valueStr = _empty;
    if (_arrStr.length) {
        _valueIds = _arrStr.join(",");
        _valueStr = _arrStr.join("<br>");
    }

    _title = form_lang.Get(lang, _title) || _title;
    label = form_lang.Get(lang, label) || label;

    var base_input = '<tr>'
        + '<td style="width:35%;">' + label + '</td>'
        + '<td style="width:65%">'
        + '<a data-original-title="'
        + _title
        + '" data-pk="1" data-type="'
        + 'select2'
        + '" id="'
        + input_id
        + '"  data-value="'
        + _valueIds
        + '" href="#" class="editable editable-click">'
        + _valueStr
        + '</a></td></tr>\n';

    var _validate = function (_value) {
        var obj = {form: _this.form, key: _this.name, value: _value};
        jxcore.Call("sessionAdd", obj, function (param) {
            alert("CALLBACK:: " + param)
        });
    };

    _validate += ";;;";
    _validate = _validate.replace("_this.name", '"' + input_id + '"');

    var base_script = "$('#" + input_id + "').editable(" +
        JSON.stringify(

            {
                inputclass: 'input-large',
                select2: {
                    tags: options.values,
                    tokenSeparators: [",", " "]
                },

                pk: 1,
                name: input_id,
                title: _title,
                validate: _validate
            }
        ) + ");";
    base_script = base_script.replace(new RegExp("\"function", "g"), "function")
        .replace(/\\n/g, " ")
        .replace(/\\t/g, " ")
        .replace(/\\\"/g, "\"")
        .replace(new RegExp("};;;\"", "g"), "}");

    return {html: base_input, js: base_script};
};


exports.createComboDate = function (label, _title, input_id, _value, lang, options) {

    _value = _value || form_lang.Get(lang, "Empty");
    _title = form_lang.Get(lang, _title) || _title;
    label = form_lang.Get(lang, label) || label;

    var format = options && options.format || "";
    var _format = format.replace(/([./-])/g, " $1 ");

    var base_input = '<tr>'
        + '<td style="width:35%;">' + label + '</td>'
        + '<td style="width:65%">'
        + '<a data-original-title="'
        + _title
        + '" data-pk="1" data-type="'
        + 'combodate'
        + '" data-template="' + _format + '" data-viewformat="' + format + '" data-format="' + format + '" data-value="' + _value
        + '" id="'
        + input_id
        + '" href="#" class="editable editable-click">'
        + _value
        + '</a></td></tr>';

    var _validate = function (_value) {
        var obj = {form: _this.form, key: _this.name, value: _value};
        jxcore.Call("sessionAdd", obj, function (param) {
            alert("CALLBACK:: " + param)
        });
    };

    _validate += ";;;";
    _validate = _validate.replace("_this.name", '"' + input_id + '"');

    var base_script = "$('#" + input_id + "').editable(" +
        JSON.stringify({

            pk: 1,
            name: input_id,
            title: _title,
            validate: _validate
        }) + ");";
    base_script = base_script.replace(new RegExp("\"function", "g"), "function")
        .replace(/\\n/g, " ")
        .replace(/\\t/g, " ")
        .replace(/\\\"/g, "\"")
        .replace(new RegExp("};;;\"", "g"), "}");

    return {html: base_input, js: base_script};
};

exports.end = "</tbody></table>";

