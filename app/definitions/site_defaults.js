var form_lang = require('../definitions/form_lang');

// site defaults are only ENGLISH!
exports.EN = {
    title: "JXPanel",
    panelName : "JXPanel",
    dashboardTitle:function(lang, active_user){
        var str = form_lang.Get(lang, "WelcomeDashboard", null, [active_user.nameTitle]);

        return str;
    },
    dashboardMessage: function(lang, active_user){
        return "Some text here";
    }
};

//{{defaults.LABELHERE}}