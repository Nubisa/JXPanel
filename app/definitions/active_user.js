var forms = require('../rendering/form_templates');

var users = {};

users["XXX"] = {
 nameTitle : "John Doe",
 lang : "EN",
 session : { forms:{} }
};

exports.getUser = function(sessionId)
{
    if(!users[sessionId]){
        //bring from DB etc...
        users[sessionId] = {
            nameTitle: "",
            lang: "EN",
            session: { forms:{} }
        };
    }

    return users[sessionId];
};

exports.getForm = function(sessionId, form_name){
    // TODO check permissions to form

    if(forms[form_name]){
        return forms[form_name](sessionId);
    }

    return "";
};

exports.hasPermission = function(sessionId, file){
    console.log(file); // file path

    return true;
};

//{{user.LABELHERE}}
