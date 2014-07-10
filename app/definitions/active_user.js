var forms = require('../rendering/form_templates');

exports.nameTitle = "John Doe";
exports.lang = "EN";
exports.session = { forms:{} };

exports.getForm = function(form_name){
    // TODO check permissions to form

    if(forms[form_name]){
        return forms[form_name]();
    }

    return "";
};

//{{user.LABELHERE}}
