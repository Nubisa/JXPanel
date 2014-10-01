/**
 * Created by Nubisa Inc. on 7/15/14.
 */

var _active_user = require('../definitions/active_user');
var form_lang = require('../definitions/form_lang');
var fs = require("fs");
var path = require("path");
var rep = require('./smart_search').replace;
var database = require("./../install/database");
var system_tools = require("./../system_tools");
var hosting_tools = require("./../hosting_tools");
var site_defaults = require("./../definitions/site_defaults");
var tools = require("./form_tools");
var folder_utils = require("../definitions/user_folders");
var page_utils = require("./page_utils");


var getTable = function(table_name) {
    var tableFileName = path.join(__dirname, "../definitions/datatables/" + table_name + ".js");

    if (fs.existsSync(tableFileName))
        return require(tableFileName);

    return null;
};


var getForm = function(table) {

    var fname = path.join(__dirname, '../definitions/forms/' + table.settings.addForm + ".js");

    if (fs.existsSync(fname)) {
        return require(fname).form();
    }
};

var getHTML = function (active_user, table) {

    var ret = { err: false, html: null };

    var columns = table.settings.columns;
    var form = getForm(table);

    if (!form)
        return { err: form_lang.Get(active_user.lang, "UnknownForm") };

    // getting form control display names
    var formControls = tools.getFormControls(form);

    var ret = [];
    ret.push([]);

    // searching for display names of controls
    for (var a in columns) {
        var displayName = columns[a];
        if (displayName == "_checkbox") displayName = "";
        if (displayName == "_id") displayName = "ID";
        if (displayName == "port_http") displayName = "TCP";
        if (displayName == "port_https") displayName = "TCPS";

        if (formControls[columns[a]] && formControls[columns[a]].details) {
            displayName = form_lang.Get(active_user.lang, formControls[columns[a]].details.label);
        }

        // for virtual fields not defined in form (e.g. on domains list)
        if (displayName === "plan_table_id")
            displayName = form_lang.Get(active_user.lang, "PlanID");

        ret[0].push(displayName);
    }

    var data = null;
    var method = null;
    if (table.name == "users") {
        data = [];
        // active user
        data.push(active_user.username);
        data = data.concat(database.getUsersByUserName(active_user.username, 1));
        method = database.getUser;
    }
    else if (table.name == "plans") {
        data = database.getPlansByUserName(active_user.username, 1);
        method = database.getPlan;
    }
    else if (table.name == "domains") {
        data = database.getDomainsByUserName(active_user.username, 1);
        method = database.getDomain;
    }
    else {
        return { err: form_lang.Get(active_user.lang, "UnknownDataTable") };
    }

    var cnt = 1;
    for (var i in data) {

        var name = data[i];
        var record_org = method(name);

        // empty record?
        if (!record_org)
            continue;

        // copying
        var record = {};
        for(var o in record_org)
            record[o] = record_org[o];

        if (table.name == "plans" && record.planMaximums) {
            // copying values for easier display to the list
            for(var o in record.planMaximums) {
                var v = record.planMaximums[o];
                record[o] = v ===  database.defaultMaximum ? "" : v;
            }
        }

        var single_row = [];

        if (record.name === active_user.username)
            single_row["_class"] = "warning";

        for (var x in columns) {
            var colName = columns[x];
            if (formControls[columns[x]] && formControls[columns[x]].details.dbName)
                colName = formControls[columns[x]].details.dbName;

            var val = record[colName];

            val = tools.getFieldDisplayValue(active_user, form, colName, record);

            // virtual column with plan name
            if (colName === "plan_table_id" && table.name === "domains") {
                var plan = database.getPlanByDomainName(record.name);
                if (plan && plan.name) val = plan.name;
            }

            var str = '<a href="#" onclick="jxEditRow(\'' + record.name + '\'); return false;">' + val + '</a>';
            // no href if there is already one
            if (val && val.indexOf && val.indexOf("onclick") !== -1) str = val;

            if (colName === "_checkbox")
                str = record.name === active_user.username ? "" : '<input type="checkbox" id="jxrow_' + record.name + '"></input>';
            else if (colName === "_id")
                str = cnt++;

            single_row.push(str);
        }
        ret.push(single_row);
    }

    return { err: false, html: exports.getDataTable(ret)};
};


// gets information about npm modules installed in global module path
var getModules = function(active_user, table) {

    var data = [];
    try {
        var modulesDir = path.normalize(site_defaults.dirNativeModules + "/node_modules/");
        var folders = fs.readdirSync(modulesDir);

        for (var a = 0, len = folders.length; a < len; a++) {
            if (folders[a].slice(0, 1) !== ".") {
                var file = path.join(modulesDir, "/", folders[a], "/package.json");

                try {
                    if (fs.existsSync(file)) {
                        var json = JSON.parse(fs.readFileSync(file));
                        data.push(json);
                    }
                } catch (ex) {
                }
            }
        }
    } catch (ex) {
    }


    var columns = table.settings.columns;
    var arr = [];
    arr.push([]); // columns
    for (var a in columns) {
        var displayName = columns[a];
        if (displayName == "_checkbox") displayName = "";
        if (displayName == "_id") displayName = "ID";
        arr[0].push(displayName);
    }

    var cnt = 1;
    for (var i in data) {

        var module = data[i];

        var single_row = [];
        for (var x in columns) {
            var colName = columns[x];
            var str = module[colName];
            if (colName === "_checkbox")
                str = '<input type="checkbox" id="jxrow_' + module.name + '"></input>';
            else if (colName === "_id")
                str = cnt++;

            single_row.push(str);
        }
        arr.push(single_row);
    }

    return { err: false, html: exports.getDataTable(arr)};
};


// each rows is array of cells
// first row is column array
// e.g.
// [
//  [ "col1", "col2", "col3" ],      // columns
//  [ "val1", val2, true ],          // row1
//  [ "val1", val2, true ]           // row2
// ]

exports.getDataTable = function(rows, columnClasses) {

    var cols = rows[0];

    var thead = [];
    var tbody = [];

    for(var rowID in rows) {

        if (rowID + "" === "0") {
            for(var colID in cols) {

                var td = "<td>";
                if (columnClasses && columnClasses[cols[colID]]) {
                    td = '<td class="' + columnClasses[cols[colID]] +'">';
                }
                thead.push(td + cols[colID] + "</td>")
            }
        } else {
            var _class = rows[rowID]["_class"] || "";
            if (!_class)
                tbody.push('<tr>')
            else {
                tbody.push('<tr class="' + _class +'">');
                delete rows[rowID]["_class"];
            }

            for(var colID in rows[rowID]) {
                tbody.push("<td>" + rows[rowID][colID] + "</td>");
            }
            tbody.push("</tr>");
        }
    }

    return "<thead><tr>" + thead.join("\n") + "</tr></thead>\n<tbody>" + tbody.join("\n") + "</tbody>";
};


exports.render = function (sessionId, table_name, getContents) {

    var active_user = _active_user.getUser(sessionId);

    if (!active_user)
        return { err : form_lang.Get(active_user.lang, "SessionExpired")}

    var table = getTable(table_name);
    if (!table)
        return form_lang.Get(active_user.lang, "UnknownDataTable");

    if (!getContents) {
        // general template of the table (without data contents)
        var containerFile = path.join(__dirname, "../definitions/datatables/datatable.html");
        if (fs.existsSync(containerFile)) {
            var widget = fs.readFileSync(containerFile).toString();
            logic.globals = { name: table_name, contents: "<thead><tr><td></td></tr></thead><tbody><tr><td></td></tr></tbody>", active_user: active_user, table : table};
            var result = rep(widget, logic);

            return result;
        } else {
            return form_lang.Get(active_user.lang, "UnknownDataTable");
        }
    } else {
        // data contents of the table
        if (table_name === "modules")
            return getModules(active_user, table);
        else
        if (table_name === "langs")
            return exports.getLangs(active_user, table);
        else
            return getHTML(active_user, table);
    }
};


var logic = [
    {from: "{{label.$$}}", to: "$$", "$": function (val, gl) {
        var active_user = gl.active_user;
        var res = form_lang.Get(active_user.lang, val);
        return !res ? "" : res;
    }
    },
    {from: "{{plan.$$}}", to: "$$", "$": function (val, gl) {

        if (!gl.plan)
            return "";

        if (val === "name")
            return gl.plan.name;

        if (val === "status" && gl.form) {
            return tools.getFieldDisplayValue(gl.active_user, gl.form, "suspended", gl.plan);
        }

//        var active_user = gl.active_user;
//        var res = form_lang.Get(active_user.lang, val);
        return "";
    }
    },
    {from: "{{datatable.##}}", to: "##", "#": function (val, gl) {
        if (val == "id")
            return gl.name;

        if (val == "displayName")
            return form_lang.Get(gl.lang, gl.table.displayNameLabel || gl.name, true);

        if (val == "buttons") {
            var containerFile = path.join(__dirname, "../definitions/datatables/" + gl.name + "_buttons.html");
            if (fs.existsSync(containerFile)) {
                var txt = fs.readFileSync(containerFile).toString();
                return rep(txt, logic);
            } else
                return "";
        }

        if (val === "myPlan") {
            return exports.getMyPlanAsTable(gl.active_user);
        }

        if (val === "myPlanContents") {
            return gl.contents;
        }

        return form_lang.Get(gl.lang, gl[val], true);
    }},
    {from: "{{user.$$}}", to: "$$", "$": function (val, gl) {
        if (val == "ftpAccess") {
            var user = database.getUser(gl.active_user.username);
            var fname = path.join(__dirname, '../definitions/forms/addUser.js');
            var frm = require(fname).form();
            return tools.getFieldDisplayValue(gl.active_user, frm, "ftp_access", user);
        }
    }}
];


// collects home dirs for each user and each domain
var getHomePaths = function(active_user) {

    var users = database.getUsersByUserName(active_user.username, 1e7);
    var domains = database.getDomainsByUserName(active_user.username, 1e7);
    var plans = database.getPlansByUserName(active_user.username, 1e7);

    var ret = { users : {}, domains : {}, plans : {} };
    for(var o in users) {
        var user = database.getUser(users[o]);
        ret.users[users[o]] = folder_utils.getUserPath(user.plan, user.name);
    }

    for(var o in domains) {
        var domain = database.getDomain(domains[o]);
        var user = database.getUser(domain.owner);
        var paths = [];
        paths.push(hosting_tools.appGetHomeDirByPlanAndUser(user.plan, user.name, domains[o]));
        var spawner = hosting_tools.appGetSpawnerPath(domains[o]);
        if (!spawner.err)
            paths.push(spawner);
        var options = hosting_tools.appGetOptions(domains[o]);
        if (!options.err)
            paths.push(options.cfg_path);
        var nginxCfg = hosting_tools.appGetNginxConfigPath(domains[o]);
        if (!nginxCfg.err)
            paths.push(nginxCfg);
        ret.domains[domains[o]] = paths;
    }

    for(var o in plans) {
        ret.plans[plans[o]] = folder_utils.getPlanPath(plans[o]);
    }

    return ret;
};


var updateArrUnique = function(base, ext){
    for(var id in ext)
        if (base.indexOf(ext[id]) === -1)
            base.push(ext[id])
};

exports.remove = function (sessionId, table_name, ids, withUserFiles, cb) {

    var active_user = _active_user.getUser(sessionId);

    var homeDirs = getHomePaths(active_user);

    var table = getTable(table_name);
    if (!table) {
        cb(form_lang.Get(active_user.lang, "UnknownDataTable"));
    }

    if (!ids) {
        cb(form_lang.Get(active_user.lang, "EmptySelection"));
    }

    var method = null;
    var isOwner = null;
    if (table.name == "users") {
        method = database.deleteUser;
        isOwner = function(name) { return database.isOwnerOfUser(active_user.username, name) };
    } else
    if (table.name == "plans") {
        method = database.deletePlan;
        isOwner = function(name) { return database.isOwnerOfPlan(active_user.username, name) };
    } else
    if (table.name == "domains") {
        method = database.deleteDomain;
        isOwner = function(name) { return database.isOwnerOfDomain(active_user.username, name) };
    } else {
        cb(form_lang.Get(active_user.lang, "UnknownDataTable"));
    }

    var accessDenied = [];
    var domainsToRemove = [];
    var usersToRemove = [];
    var plansToRemove = [];
    var errors = [];
    // multiple selection on list
    for(var i in ids) {

        if (!isOwner(ids[i])) {
            accessDenied.push(ids[i]);
            continue;
        }

        var ret = null;
        try {
            ret = method(ids[i]);
            if (!ret.deleted)
                errors.push(ret);
        } catch (ex) {
            console.error(ex);
            errors.push(form_lang.Get(active_user.lang, "DBCannotRemoveRecord", true, [ ids[i] ]));
        }

        if (ret.deleted) {
            if (ret.users) updateArrUnique(usersToRemove, ret.users);
            if (ret.domains) updateArrUnique(domainsToRemove, ret.domains);
            if (ret.plans) updateArrUnique(plansToRemove, ret.plans);
        }
    }

    var removeUsers = function() {
        for(var o in usersToRemove) {
            _active_user.clearUserByName(usersToRemove[o]);
            var ret1 = system_tools.deleteSystemUser(usersToRemove[o]);
            if (ret1.err) {
                errors.push(form_lang.Get(active_user.lang, ret1.err, true));
            }
            if (homeDirs && homeDirs.users[usersToRemove[o]]) {
                if (withUserFiles) {
                    system_tools.rmdirSync(homeDirs.users[usersToRemove[o]]);
                } else {
                    // moving user's the folder to _deleted
                    var deletedFolder = site_defaults.apps_folder + path.sep + "deleted" + path.sep;
                    if (!fs.existsSync(deletedFolder))
                        fs.mkdirSync(deletedFolder);

                    var d = new Date();
                    var str = d.getDate() + "-" + d.getMonth() + "-" + d.getFullYear();
                    var cmd = "mv " + homeDirs.users[usersToRemove[o]] + " " + deletedFolder + usersToRemove[o] + "_" + str;
                    var res = jxcore.utils.cmdSync(cmd);
                }
            }
        }

        // removing plans folders
        if (withUserFiles && homeDirs) {
            for(var o in plansToRemove) {
                system_tools.rmdirSync(homeDirs.plans[plansToRemove[o]]);
            }
        }

        cb(errors.length ? errors.join(" ") : false);
    };

    // first we should stop apps before removing folders
    hosting_tools.appStopMultiple(domainsToRemove, function(err, infos) {
        if (err) {
            for(var domain_name in infos) {
                if (infos[domain_name].err)
                    errors.push(err);
            }
        }

        if (withUserFiles && homeDirs) {
            for(var o in domainsToRemove) {
                var domain_name = domainsToRemove[o];
                if (homeDirs.domains[domain_name]) {
                    for(var i in homeDirs.domains[domain_name])
                        system_tools.rmdirSync(homeDirs.domains[domain_name][i]);
                }
            }
        }

        removeUsers();
    });


};

// called when user clicked Apply on the form
// here record info is stored in session arr and they will be available after automatic panel refresh
exports.edit = function (sessionId, table_name, id) {
    var active_user = _active_user.getUser(sessionId);

    var table = getTable(table_name);
    if (!table)
        return { err : form_lang.Get(active_user.lang, "UnknownDataTable") };

    var form = getForm(table);
        if (!form)
            return { err : form_lang.Get(active_user.lang, "UnknownForm") };

    if (!id)
        return { err : form_lang.Get(active_user.lang, "EmptySelection") };

    active_user.session.edits = active_user.session.edits || {};
    active_user.session.edits[table.settings.addForm] = { ID : id };
    active_user.session.edits.lastForm = table.settings.addForm;
    active_user.session.lastPath = "/" + table.settings.addFormURL;

    active_user.session.edits.subPages = form.subPages;
    if (form.subForms) {
        for (var a in form.subForms) {
            active_user.session.edits[form.subForms[a]] = { ID : id };
        }
    }

    return {err : false, url : table.settings.addFormURL};
};


var getMyPlan = function(active_user) {

    var plan = database.getPlan(active_user.plan);
    if (plan === database.unlimitedPlanName)
        return "";

    var table = getTable("plans");
    if (!table)
        return form_lang.Get(active_user.lang, "UnknownDataTable");

    var form = getForm(table);
    if (!form)
        return form_lang.Get(active_user.lang, "UnknownForm");

    var html = "";
    for(var o in form.controls) {
        var ctrl = form.controls[o];
        if (!ctrl.name)
            continue;

        var dbName = ctrl.details.dbName || ctrl.name;
        var val = ctrl.details.getValue ? ctrl.details.getValue(active_user, plan, true) : plan[dbName];

        html += form_lang.Get(active_user.lang, ctrl.details.label) + ': <span class="label label-warning" style="margin-right: 20px;">' + val + '</span>';
    }

    return '<div style="margin-bottom: 20px;">' + html + "</div>" + "<br><br><br>" + exports.getMyPlanAsTable(active_user);
};


exports.getMyPlanAsTable = function (active_user) {

    var plan = database.getPlan(active_user.plan);
//    if (plan.name === database.unlimitedPlanName)
//        return "";

    var table = getTable("plans");
    if (!table)
        return form_lang.Get(active_user.lang, "UnknownDataTable");

    var form = getForm(table);
    if (!form)
        return form_lang.Get(active_user.lang, "UnknownForm");

    var html = [];
    for (var o in form.controls) {
        var ctrl = form.controls[o];
        if (!ctrl.name)
            continue;

        var dbName = ctrl.details.dbName || ctrl.name;
        var val = tools.getFieldDisplayValue(active_user, form, dbName, plan);
        var usage = "";

        if (ctrl.name === "plan_max_users") {
            var arr = database.getUsersByPlanName(plan.name, 1e7);
            usage = page_utils.getProgressBar(val, arr.length);
        } else
        if (ctrl.name === "plan_max_domains") {
            var arr = database.getDomainsByPlanName(plan.name, 1e7);
            usage = page_utils.getProgressBar(val, arr.length);
        } else
        if (ctrl.name === "plan_max_plans") {
            var arr = database.getPlansByPlanName(plan.name, 1e7);
            usage = page_utils.getProgressBar(val, arr.length);
        } else
        if (ctrl.name === "plan_disk_space") {
            var size = parseInt(folder_utils.getUserPathSize(active_user.username));
            usage = page_utils.getProgressBar(plan.planMaximums[dbName] === -1 ? size * 2 : val, size, "MB");
        } else
        if (ctrl.name === "plan_nginx_directives" && val && val.length) {
            var str = val.replace(/"/g, "`").replace(/'/g, "`").replace(/\n/g, "<br>");
            val = '<a href="javascript:void(0);" class="btn btn-default" style="margin: 0px;" rel="popover-hover" data-placement="top" data-original-title="'
                  + form_lang.Get(active_user.lang, "NginxDirectives", true)
                  + '" data-content="' + str + '">'
                  + str.trim().slice(0, 30) + " [...]"
                  + "</a>";
        }

        html.push('<tr>');
        html.push('<td>' + form_lang.Get(active_user.lang, ctrl.details.label) + '</td>');
        html.push('<td>' + val + '</td>');
        html.push('<td>' + usage + '</td>');
        html.push('</tr>');
    }

    logic.globals = { name: "plans", contents: html.join("\n"), active_user: active_user, table: table, plan: plan, form : form };
    var tmp = fs.readFileSync(path.join(__dirname, "../definitions/datatables/myPlan.html")).toString();
    var result = rep(tmp, logic);

    return result;
};


exports.getLangs = function (active_user, table) {

    var columns = table.settings.columns;
    var arr = [];
    arr.push([]); // columns
    for (var a in columns) {
        var displayName = columns[a];
        if (displayName == "_checkbox") displayName = ""; else
        if (displayName == "_id") displayName = "ID"; else
        displayName = form_lang.Get(active_user.lang, displayName, true);
        arr[0].push(displayName);
    }

    var cnt = 1;
    for(var i in form_lang.langs.EN) {

        var _id = form_lang.ids.indexOf(i);

        var single_row = [];
        for (var x in columns) {
            var colName = columns[x];
            var str = "";
            if (colName === "_checkbox")
                str = '<input type="checkbox" id="jxrow_' + i + '"></input>';
            else if (colName === "_id")
                str = cnt++;
            else if (colName === "Original")
                str =  form_lang.langs.EN[i];
            else if (colName === "Translation") {

                var divs = [];
                for(var _lang in form_lang.langs) {

                    if (_lang === "EN") continue;

                    var _str = "";
                    var _class = ""
                    if (form_lang.langs[_lang] && form_lang.langs[_lang][i] && form_lang.langs[_lang][i] != form_lang.langs.EN[i]) {
                        if (form_lang.show_only_undefined) {
                            continue;
                        }
                        _str = form_lang.langs[_lang][i];
                        _class = "has-success";
                    } else {
                        _str = "";
                        _class = "has-warning";
                    }

                    divs.push('<div class="input-group ' + _class +' jxl" id="jxld_' + _lang  + "_" + _id +'" ><span class="input-group-addon"><i class="flag flag-'+_lang.toLowerCase()+'"></i></span>'
                        +'<input type="textarea" placeholder="'+ form_lang.Get(_lang, "Undefined", true) +'" id="jxl_' + _lang  + "_" + _id +'" class="form-control langs" value="' + _str + '"></input>'
                        +'</div>');
                }
                str += divs.join("<br>");
//                str += '<br><input type="button" value="' + form_lang.Get(active_user.lang, "Save", true) + '" id="jxb_' + _id +'"></input>';
            }
            else if (colName === "Apply") {

            }
            single_row.push(str);
        }
        arr.push(single_row);
    }

    var columnClasses = {};
    columnClasses[form_lang.Get(active_user.lang, "Original", true)] = "original";
    columnClasses[form_lang.Get(active_user.lang, "Translation", true)] = "translation";
    return { err: false, html: exports.getDataTable(arr, columnClasses )};
};