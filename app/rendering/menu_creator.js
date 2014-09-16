var database = require('../install/database');

exports.hasView = function(active_user, file){
    if(!active_user)
    {
        return file == "../ui//index.html";
    }

    var plan = database.getPlan(active_user.plan);
    if(file == "../ui//addplan.html"){
        return plan.canCreatePlan;
    }

    if(file == "../ui//adduser.html"){
        return plan.canCreateUser;
    }

    if(file == "../ui//console.html"){
        return plan.plan_ssh;
    }

    if(file == "../ui//uploads.html"){
        return !plan.suspended;
    }

    if(file == "../ui//jxcore.html"){
        return plan.name == database.unlimitedPlanName;
    }

    if(file == "../ui//npmw.html"){
        return plan.name == database.unlimitedPlanName;
    }

    return true;
};

exports.render = function(active_user){

    var plan = database.getPlan(active_user.plan);

    var str = '';

    if(plan.canCreatePlan){
        str += "<div class='normal-menu' id='hostingp'>{{label.DataPlans}}</div>";
    }

    if(plan.canCreateUser){
        str += "<div class='normal-menu' id='users'>{{label.UsersUpperCase}}</div>";
    }

    str += "<div class='normal-menu' id='domains'>{{label.DomainsUpperCase}}</div>";

    str += "<div class='bold-menu' style='margin-top:10px;'>{{label.ToolsAndServices}}</div>";

    if(plan.name == "Unlimited"){
        str += "<div class='normal-menu' id='jxcore'>{{label.JXcoreUpperCase}}</div>";
        str += "<div class='normal-menu' id='npmw'>{{label.JXcoreNPMModules}}</div>";
    }

    str += "<div class='normal-menu' id='filem'>{{label.fileManager}}</div>";

    if(plan.plan_ssh) {
        str += "<div class='normal-menu' id='remotem'>{{label.RemoteManagement}}</div>";
    }

    str += "<div class='normal-menu' id='configuration'>{{label.Configuration}}</div>";
    str += "<div class='bold-menu' style='margin-top:10px;'>{{label.Extras}}</div>";
    str += "<div class='normal-menu' id='addonm'>{{label.AddOnManager}}</div>";
    str += "<div class='normal-menu' id='help'>{{label.help}}</div>";

    return str;
};