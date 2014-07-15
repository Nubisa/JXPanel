var forms = require('../rendering/form_templates');
var datatables = require('../rendering/datatable_templates');

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

    return forms.renderForm(sessionId, form_name);
};

exports.hasPermission = function(sessionId, file){
    console.log("active_user::hasPermission", sessionId, file); // file path

    return true;
};


exports.getDataTable = function(sessionId, table_name){
    console.log("active_user::getDataTable", sessionId, table_name);

    return datatables.render(sessionId, table_name);
};

//{{user.LABELHERE}}
