/**
 * Created by Nubisa Inc. on 7/11/14.
 */

var tool = require('./../../rendering/form_tools');
var apps_tools = require('./../../rendering/apps_tools');
var form_lang = require('../form_lang');
var _active_user = require('../active_user');
var path = require("path");
var validations = require('./../validations');
var hosting_tools = require("./../../hosting_tools");
var ip_tools = require("./../../ip_tools");
var database = require("./../../install/database");


var getStatus = function(active_user, values, listOrForm, short) {

    // form is in "add" mode, not "edit"
    if (!values || !values["name"])
        return iconOffline;

    var plan = database.getPlanByDomainName(values.name);

    var domain_name = values["name"];
    var short_str = domain_name + "<br>";

    var domain = database.getDomain(domain_name);

    var ports = '<div style="display: inline">'
        + ' <span class="label label-info">TCP: '+ domain.port_http + '</span>'
            // + ' <span class="label label-info">TCPS: '+ domain.port_https + '</span>'
        + '</div>'

    var iconOnline = form_lang.GetBool(active_user.lang, true, "RunningOn") + ports;
    var iconOffline = form_lang.GetBool(active_user.lang, false, null, "Offline");

    var jxPath = hosting_tools.getJXPath();
    if (jxPath.err)
        return short ? short_str + iconOffline : iconOffline + ". " + form_lang.Get(active_user.lang, jxPath.err, true);

    var divId = jxcore.utils.uniqueId();

    var btnStart = '<button type="button" class="btn btn-labeled btn-success" onclick="return utils.jxAppStartStop(true, \'' + domain_name + '\',' + divId + ');" style="margin-left: 20px;"><span class="btn-label"><i class="fa fa-lg fa-fw fa-play"></i></span>'
        + form_lang.Get(active_user.lang, "Start", true) + '</button>';

    var btnStop = '<button type="button" class="btn btn-labeled btn-danger" onclick="return utils.jxAppStartStop(false, \'' + domain_name + '\',' + divId + ');" style="margin-left: 20px;"><span class="btn-label"><i class="fa fa-lg fa-fw fa-stop"></i></span>'
        + form_lang.Get(active_user.lang, "Stop", true) + '</button>';

//                        var btnViewLog = listOrForm ? "" : '<button type="button" class="btn btn-labeled btn-info" onclick="document.location = \'applog.html\'; return false;" style="margin-left: 20px;"><span class="btn-label"><i class="fa fa-lg fa-fw fa-pencil-square-o"></i></span>'
//                            + form_lang.Get(active_user.lang, "JXcoreAppViewLog", true) + '</button>';

    var btnViewLog = "";

    if (plan.suspended)
        btnStart = btnStop = ". <code>" + form_lang.Get(active_user.lang, "PlanSuspended", true) + "</code>";

    if (!active_user.session.monitor && !active_user.session.monitor.json)
        return short ? short_str + iconOffline : iconOffline + ". " + form_lang.Get(active_user.lang, "JXcoreMonitorNotRunning", true);

    var ret = hosting_tools.appGetSpawnerPath(domain_name);
    if (ret.err)
        return ret.err;

    var json = "";
    if (active_user.session.monitor) {
        json = active_user.session.monitor.json || "";
    }
    if (!json)
        btnStart = btnStop = ". " + form_lang.Get(active_user.lang, "JXcoreMonitorNotRunning", true);

    var divStart = '<div id="jxAppStatus_' + divId + '">'; //'" style="display: inline-block; white-space: nowrap;">';
    var divEnd = "</div>";

    if (json.indexOf(ret) === -1) {
        return short ? short_str + iconOffline : divStart + iconOffline + btnStart + btnViewLog + divEnd;
    } else {
        return short ? short_str + iconOnline : divStart + iconOnline + btnStop + btnViewLog + divEnd;
    }
};


exports.isSubdomain = function(active_user, formName) {

    return exports.getMainDomainName(active_user, formName) ? true : false;
};


exports.getMainDomainName = function(active_user, formName) {

    var isUpdate = _active_user.isRecordUpdating(active_user, formName);
    if (!isUpdate)
        return active_user.session.edits && active_user.session.edits.addSubdomainForDomain ? active_user.session.edits.addSubdomainForDomain : false;

    // it is an update
    var domain = database.getDomain(isUpdate);
    if (!domain)
        return false;

    return domain.main_domain_name;
};


exports.form = function () {

    var func = function () {
        this.name = path.basename(__filename, ".js");

        this.icon = '<img id="domains_img" class="menu-icon" src="icons/domains.png">';
        this.title = 'DomainConfiguration';

        this.onSubmitSuccess = "domains.html";
        this.onSubmitCancel = "domains.html";

        this.displayNameLabel_Add = "AddDomain";
        this.displayNameLabel_Edit = "EditDomain";

        this.subPages = [ "/adddomain.html", "/applog.html" ];
        this.subForms = [ "appLog" ];

        this.tabs = [
            { label : "Domain Details", showAlways : false },
            { label : "JXcoreAppApp", helpDescription : {
                markdown: "TabEditOnly"
            }}
        ];

        this.controls = [
            {"BEGIN": "Domain Details"},

            {
                name: "domain_name",
                details: {
                    label: "DomainName",
                    method: tool.createTextBox,
                    options: { required: true, prefix: "www." },
                    dbName: "name", // alias to `name` in object database.getDomain();
                    cannotEdit: true
                },
                validation : new validations.Domain(),
                visibility : function(active_user, values, formName) {
                    return !exports.isSubdomain(active_user, formName);
                },
                helpDescription: {
                    markdown : "This field is not available when the form was invoke for second-level domain (subdomain)."
                }
            },

            {
                name: "subdomain_name",
                details: {
                    label: "SubDomainName",
                    method: tool.createTextBox,
                    options: { required: true, prefix: "www." },
                    dbName: "name", // alias to `name` in object database.getDomain();
                    cannotEdit: true,
                    getDescription : function(active_user, values, formName) {
                        return form_lang.Get(active_user.lang, "SubDomainName_Description", true, [ exports.getMainDomainName(active_user, formName) ] );
                    }
                },
                validation : new validations.SubDomain(),
                visibility : function(active_user, values, formName) {
                    return exports.isSubdomain(active_user, formName);
                },
                helpDescription: {
                    markdown : "This field is not available when the form was invoke for first-level domain."
                }
            },

            {
                name: "main_domain_name",
                details: {
                    label: "SubDomainName",
                    method: null,
                    options: { },
                    cannotEdit: true
                }
            },

            {
                name: "user_owner_id",
                details: {
                    label: "Username",
                    method: null,
                    options: { },
                    dbName: "owner" // alias to `owner` in object database.getDomain();
                }
            },

            // do not remove this yet, may be useful
            { name: "sub_ipv4",
                details: {
                    label: "IPv4",
                    method: tool.createComboBox,
                    options: { required: true },
                    getValuesList : function(active_user, values) {
                        return ip_tools.getUserIPs(active_user, false);
                    }
                },
                validation : new validations.IPAdresses(false),
                helpDescription: {
                    markdown : "This field contains one ore more IPv4 addresses selected to the hosting plan (to which currently logged-in user belongs) by a parent user. " +
                    "It is possible to choose only one."
                }
            },

            { name: "sub_ipv6",
                details: {
                    label: "IPv6",
                    method: tool.createComboBox,
                    options: { required: true, hiddenValue : null },
                    getValuesList : function(active_user, values) {
                        return ip_tools.getUserIPs(active_user, true);
                    }
                },
                validation : new validations.IPAdresses(true),
                visibility : function(active_user, values, listOrForm) {
                    return ip_tools.getUserIPs(active_user, true).length > 0;
                },
                helpDescription: {
                    markdown :
                    "This field is available only in case when the hosting plan, to which currently logged-in user belongs allows at least one of IPv6 addresses to use. " +
                    "It is possible to choose only one IPv6 address from the drop-down list."
                }
            },

            {"END" : 1},

            {"BEGIN": "JXcore options"},

            {
                name: "jx_app_status",
                details: {
                    label: "JXcoreAppStatus",
                    method: tool.createSimpleText,
                    options: { },
                    getValue : function(active_user, values, listOrForm) {
                        return getStatus(active_user, values, listOrForm, false);
                    }
                },
                helpDescription: {
                    markdown :
                    "This is read-only field which displays information about domain's application status: whether it is {{labeli.Offline}} or {{labeli.Running}}. " +
                    "In either case, there is an appropriate button visible: {{btn.Start}} or {{btn.Stop}} respectively. "
                }
            },

            {
                name: "jx_app_status_short",
                details: {
                    label: "JXcoreAppStatus",
                    method: null,
                    dbName : null,
                    options: { },
                    getValue : function(active_user, values, listOrForm) {
                        return getStatus(active_user, values, listOrForm, true);
                    }
                }
            },

            {
                name: "jx_app_type",
                details: {
                    label: "JXcoreAppType",
                    method: tool.createComboBox,
                    options: { required : true, values : [ "custom", "Ghost", "NodeBB", "Meteor" ], default : "custom" }
                },
                validation : new validations.AppType(),
                helpDescription: {
                    markdown :
                    "You can choose between *custom*, *Ghost*, *NodeBB* or *Meteor*.\n" +
                    "The *custom* option allows you to run your own application, and so you will need also to specify {{labelb.JXcoreAppPath}}.\n" +
                    "Other options refer to 3-rd party application that can be installed separately per domain."
                }
            },

            {
                name: "jx_app_path",
                details: {
                    label: "JXcoreAppPath",
                    method: tool.createTextBox,
                    options: { default : "index.js" }
                },
                validation : new validations.FileName(),
                helpDescription: {
                    markdown :
                    "This field is related with *custom* value when selected in the {{labelb.JXcoreAppType}} field. In this case it is also required."
                }
            },

            {
                name: "jx_app_args",
                details: {
                    label: "JXcoreAppArgs",
                    method: tool.createTextBox,
                    options: { }
                },
                validation : new validations.AppArgs()
            },

            { name: "jx_web_log",
                details: {
                    label: "AppLogWebAccess",
                    method: tool.createCheckBox,
                    options: { }
                },
                validation : new validations.Boolean()
            },

            {"END" : 1},

            {"BEGIN": "SSL"},

            {"INFO": "ValuesOnlyForEdit", OnEdit : false, prefix : "<code>", suffix : "</code>" },

            {
                name: "ssl",
                details: {
                    label: "DomainEnableSSL",
                    method: tool.createCheckBox,
                    options: { },
                    cannotInsert : true
                },
                validation : new validations.Boolean()
            },

            {
                name: "ssl_crt",
                details: {
                    label: "DomainSSLCertFile",
                    method: tool.createTextBox,
                    options: { },
                    cannotInsert : true
                },
                validation : new validations.SSLCertFileName()
            },

            {
                name: "ssl_key",
                details: {
                    label: "DomainSSLKeyFile",
                    method: tool.createTextBox,
                    options: { },
                    cannotInsert : true
                },
                validation : new validations.SSLCertFileName(true)
            },

            {"END" : 1},

            {"INFO": "JXcoreAppAppInfo", tab : 1, OnInsert : false  },

            {"BEGIN": "Ghost", tab : 1, OnInsert : false},

            {
                name: "jx_app_ghost",
                details: {
                    label: "Ghost",
                    method: tool.createSimpleText,
                    options: { },
                    cannotInsert : true,
                    getValue: function (active_user, values, listOrForm) {
                        var domain_name = values["name"];
                        return apps_tools.getAppStatus(active_user, domain_name, "Ghost");
                    }
                },
                helpDescription: {
                    markdown :
                        "Display status of Ghost application - whether it is installed for a domain or not."
                }
            },

            {"END" : 1},

            {"BEGIN": "NodeBB", tab : 1, OnInsert : false},

            {
                name: "jx_app_nodebb",
                details: {
                    label: "NodeBB",
                    method: tool.createSimpleText,
                    options: { },
                    cannotInsert : true,
                    getValue: function (active_user, values, listOrForm) {
                        if (!values || !values["name"]) return false;
                        var domain_name = values["name"];
                        return apps_tools.getAppStatus(active_user, domain_name, "NodeBB");
                    }
                },
                helpDescription: {
                    markdown :
                        "Display status of NodeBB application - whether it is installed for a domain or not."
                }
            },

            {
                name: "nodebb_mongodb_port",
                details: {
                    label: "MongoDB port",
                    method: tool.createTextBox,
                    options: { }
                },
                validation : new validations.Int(),
                visibility : function(active_user, values, listOrForm) {
                    if (!values || !values["name"]) return false;
                    var domain_name = values["name"];
                    var data = apps_tools.getData(domain_name, "NodeBB");
                    return data.exists;
                }
            },

            {
                name: "nodebb_mongodb_database",
                details: {
                    label: "MongoDB database",
                    method: tool.createTextBox,
                    options: { }
                },
//                validation : new validations.UserName()
                visibility : function(active_user, values, listOrForm) {
                    if (!values || values["name"]) return false;
                    var domain_name = values["name"];
                    var data = apps_tools.getData(domain_name, "NodeBB");
                    return data.exists;
                }
            },

            {
                name: "nodebb_mongodb_username",
                details: {
                    label: "MongoDB username",
                    method: tool.createTextBox,
                    options: { }
                },
//                validation : new validations.UserName()
                visibility : function(active_user, values, listOrForm) {
                    if (!values || !values["name"]) return false;
                    var domain_name = values["name"];
                    var data = apps_tools.getData(domain_name, "NodeBB");
                    return data.exists;
                }
            },

            {
                name: "nodebb_mongodb_pwd",
                details: {
                    label: "MongoDB password",
                    method: tool.createTextBox,
                    options: { password : true },
                    dbName: false
                },
                visibility : function(active_user, values, listOrForm) {
                    if (!values || !values["name"]) return false;
                    var domain_name = values["name"];
                    var data = apps_tools.getData(domain_name, "NodeBB");
                    return data.exists;
                }
            },

//            {
//                name: "nodebb_admin_username",
//                details: {
//                    label: "Admin username",
//                    method: tool.createTextBox,
//                    options: { },
//                    dbName: false
//                }
////                validation : new validations.UserName()
//            },
//
//            {
//                name: "nodebb_admin_email",
//                details: {
//                    label: "Admin email",
//                    method: tool.createTextBox,
//                    options: { },
//                    dbName: false
//                },
//                validation : new validations.Email()
//            },
//
//            {
//                name: "nodebb_admin_pwd",
//                details: {
//                    label: "Admin password",
//                    method: tool.createTextBox,
//                    options: { password : true },
//                    dbName: false
//                }
//            },

            {"END" : 1},

            {"BEGIN": "Meteor", tab : 1, OnInsert : false},

            {
                name: "jx_app_meteor",
                details: {
                    label: "Meteor",
                    method: tool.createSimpleText,
                    options: { },
                    cannotInsert : true,
                    getValue: function (active_user, values, listOrForm) {
                        var domain_name = values["name"];
                        return apps_tools.getAppStatus(active_user, domain_name, "Meteor");
                    }
                },
                helpDescription: {
                    markdown :
                        "Display status of Meteor application - whether it is installed for a domain or not."
                }
            },

            {"END" : 1}

        ];
    };

    return new func();
};
