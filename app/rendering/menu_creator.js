var database = require('../install/database');
var form_lang = require("../definitions/form_lang");
var _active_user = require("../definitions/active_user");

// menu items in array (order matters)
var menuItems = [

    {
        name: "loginpage",
        label: "LoginPage",
        menu : "help" // help menu only
    },
    {
        name: "dashboard",
        label: "Dashboard"
    },
    {
        label : "Management",
        group : true
    },

    {
        name : "hostingp",
        label : "DataPlans",
        plan_check : "canCreatePlan"
    },
    {
        name : "users",
        label : "UsersUpperCase",
        plan_check : "canCreateUser"
    },
    {
        name : "domains",
        label : "DomainsUpperCase"
    },
    {
        label : "ToolsAndServices",
        group : true
    },
    {
        name : "jxcore",
        label : "JXcoreUpperCase",
        admin : true,
        menu : "main"
    },
    {
        name : "jxcore_index",
        label : "JXcoreUpperCase",
        admin : true,
        menu : "help"
    },
    {
        name: "npmw",
        label: "JXcoreNPMModules",
        admin : true
    },
    {
        name : "filem",
        label : "fileManager"
    },
    {
        name : "remotem",
        label : "RemoteManagement",
        plan_check : "plan_ssh"
    },
    {
        label : "Extras",
        group : true
    },
    {
        name : "addonm",
        label : "AddOnManager"
    },
    {
        name : "help",
        label : "help",
        menu : "main" // only main menu
    }
];


// extra definitions for links, that will not take part in menu rendering
exports.pages = {
    "adduser" : {
        label : "AddUser",
        link : "/adduser.html"
    },
    "addplan" : {
        label : "AddPlan",
        link : "/addplan.html"
    },
    "adddomain" : {
        label : "AddDomain",
        link : "/adddomain.html"
    },
    "admin_index" : {
        label : "Superusers's guide"
    },
    "jxcore_index" : {
        label : "JXcore"
    },
    "overview" : {
        label: "Product Overview"
    },
    "jxcoreloginpage" : {
        label: "LoginPageCustom"
    },
    "addons_api" : {
        label : "Add-ons"
    }
};


// cache of items by name
var menuItemsByName = {};
for(var o in menuItems)
    if (menuItems[o].name)
        menuItemsByName[menuItems[o].name] = menuItems[o];


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

// checks, whether specified menu item is allow dor user or not
var checkItem = function(active_user, item) {

    var plan = database.getPlan(active_user.plan);

    if (!item || !plan) debugger;
    if (item.admin && !_active_user.isAdmin(active_user))
        return false;

    if (item.plan_check && !plan[item.plan_check])
        return false;

    return true;
};

// return menu item with information, if is allowed for user or not (ret.denied)
exports.getMenuItem = function(active_user, item_name) {

    if (!menuItemsByName[item_name])
        return null;

    var item = JSON.parse(JSON.stringify(menuItemsByName[item_name]));
    item.denied = !checkItem(active_user, item);
    return item;
};

// return menu items per specific user
exports.getMenu = function(active_user) {

    var ret = [];

    for (var o in menuItems) {
        var item = menuItems[o];
        if (checkItem(active_user, item))
            ret.push(item);
    }

    return ret;
};

// renders html code for menu per specific user
exports.render = function(active_user){

    var items = exports.getMenu(active_user);

    var str = '';
    for(var o in items) {

        var item = items[o];
        if (item.menu == "help") continue;

        var label = form_lang.Get(active_user.lang, item.label, true);

        if (item.group)
            str += "<div class='bold-menu' style='margin-top:10px;'>" + label + "</div>";
        else
            str += "<div class='normal-menu' id='" + item.name + "'>" + label + "</div>";
    }

   return str;
};
