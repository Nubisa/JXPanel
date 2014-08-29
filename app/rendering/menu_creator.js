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

    if(file == "../ui//jxconfig.html"){
        return plan.name == database.unlimitedPlanName;
    }

    if(file == "../ui//jxmodules.html"){
        return plan.name == database.unlimitedPlanName;
    }

    return true;
};

exports.render = function(active_user){

    var plan = database.getPlan(active_user.plan);

    var str = '';

    if(plan.canCreateUser){
        str += '<li id="Menu-users">'
            + '<a href="users.html"><i class="fa fa-lg fa-fw fa-user"></i>{{label.UsersUpperCase}}</a>'
            + '</li>';
    }

    if(plan.canCreatePlan){
        str += '<li id="Menu-plans">'
            + '<a href="hostingp.html"><i class="fa fa-lg fa-fw fa-cogs"></i>{{label.DataPlans}}</a>'
            + '</li>';
    }

    str += '<li id="Menu-domains">'
         + '<a href="domains.html"><i class="fa fa-lg fa-fw fa-external-link"></i>{{label.DomainsUpperCase}}</a>'
         + '</li>'

    if(plan.name == "Unlimited"){
        str += '<li>'
            + '<a href="#"><img src="img/jx.png" style="padding-right: 13px; vertical-align: text-bottom"/>{{label.JXcoreUpperCase}}</a>'
            + '<ul>'
            + '<li id="Menu-jxconfig">'
            + '<a href="jxconfig.html">{{label.JXcoreConfiguration}}</a>'
            + '</li>'
            + '<li id="Menu-jxmodules">'
            + '<a href="jxmodules.html">{{label.JXcoreNPMModules}}</a>'
            + '</li>'
            + '</ul>'
            + '</li>';
    }

    str += '<li id="Menu-cdatatable">'
        + '<a href="cdatatable.html"><i class="fa fa-lg fa-fw fa-dashboard"></i>{{label.stats}}</a>'
        + '</li>';

    str += '<li id="Menu-editor">'
        + '<a href="editor.html"><i class="fa fa-lg fa-fw fa-hdd-o"></i>{{label.fileManager}}</a>'
        + '</li>';

    str += '<li id="Menu-xxx">'
        + '<a href="cform.html"><i class="fa fa-lg fa-fw fa-briefcase"></i>{{label.serviceManagement}}</a>'
        + '</li>';

    if(plan.plan_ssh){
        str += '<li id="Menu-console">'
            + '<a href="console.html"><i class="fa fa-lg fa-fw fa-laptop"></i>{{label.RemoteManagement}}</a>'
            + '</li>';
    }

    str += '<li id="Menu-xxx3">'
        + '<a href="cform.html"><i class="fa fa-lg fa-fw fa-question"></i>{{label.help}}</a>'
        + '</li>';

    return str;
};