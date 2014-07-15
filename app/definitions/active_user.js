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

exports.loginUser = function(sessionId, params){
    users[sessionId] = newUser(sessionId);
    users[sessionId].username = params.username;

    users[sessionId].nameTitle = params.username; // TODO change it!!!
};

exports.getUser = function(sessionId)
{
    console.log("active_user::getUser", sessionId);

    if(!users[sessionId]){
        console.log("active_user::getUser not_exist");
        return null;
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
    if(file != "../ui//index.html"){
        if(!users[sessionId]){
            return false;
        }
    }

    return true;
};


exports.getDataTable = function(sessionId, table_name){
    console.log("active_user::getDataTable", sessionId, table_name);

    return datatables.render(sessionId, table_name);
};

//{{user.LABELHERE}}
