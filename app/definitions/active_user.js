var forms = require('../rendering/form_templates');

var users = {};

var newUser = function(session_id){
    return {
        nameTitle: "John Doe",
        sessionId: session_id,
        lang: "EN",
        session: { forms:{} },
        lastOperation: Date.now() // TODO later clear the users
    };
};

exports.getUser = function(sessionId, createNew)
{
    console.log("active_user::getUser", sessionId);

    if(!users[sessionId]){
        console.log("active_user::getUser not_exist");
        if(!createNew){
            return null;
        }

        console.log("active_user::getUser creating", sessionId);
        //bring from DB etc...

        users[sessionId] = newUser(sessionId);
    }

    return users[sessionId];
};

exports.getForm = function(sessionId, form_name){
    // TODO check permissions to form
    console.log("active_user::getForm", sessionId, form_name);

    if(forms[form_name]){
        return forms[form_name](sessionId);
    }

    return "";
};

exports.hasPermission = function(sessionId, file){
    console.log("active_user::hasPermission", sessionId, file); // file path

    return true;
};

//{{user.LABELHERE}}
