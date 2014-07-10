var form_lang = require('../definitions/form_lang');
var lang = require('../definitions/active_user').lang;

var beginning = '<table style="clear: both" class="table table-bordered table-striped" id="user">'
    +'<tbody>';

var createTextBox = function(label, _title, input_id, _value){
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

    var base_script = "$('#"+input_id+"').editable(" +
        JSON.stringify({
        type: 'text',
        pk: 1,
        name: input_id,
        title: _title,
        validate:function(value){
            alert(value);
        }
    }) + ");";

    return {html:base_input, js:base_script};
};

var end = "</tbody></table>";

