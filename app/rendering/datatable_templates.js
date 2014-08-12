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
var folder_utils = require("../definitions/user_folders");


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
    var formControls = {};
    for (var i in form.controls) {
        var ctrl = form.controls[i];
        if (ctrl.name)
            formControls[ctrl.name] = ctrl;
    }

    var ret = [];
    ret.push([]);

    var dbNames = {};
    // searching for display names and dbNames of controls
    for (var a in columns) {
        var displayName = columns[a];
        if (displayName == "_checkbox") displayName = "";
        if (displayName == "_id") displayName = "ID";
        if (displayName == "port_http") displayName = "TCP";
        if (displayName == "port_https") displayName = "TCPS";

        if (formControls[columns[a]] && formControls[columns[a]].details) {
            displayName = form_lang.Get(active_user.lang, formControls[columns[a]].details.label);
            dbNames[columns[a]] = formControls[columns[a]].details.dbName || columns[a];
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
                record[o] = v ===  site_defaults.defaultMaximum ? "" : v;
            }
        }

        var single_row = [];

        if (record.name === active_user.username)
            single_row["_class"] = "success";

        for (var x in columns) {
            var colName = dbNames[columns[x]] || columns[x];
            var val = record[colName];

            if (formControls[columns[x]] && formControls[columns[x]].details && formControls[columns[x]].details.displayValues) {

                for (var _val in formControls[columns[x]].details.displayValues) {

                    // null/undefined value replacement into display value
                    var isEmpty = _val === "__EMPTY__" && (val === null || val === undefined || val === "");
                    // specific value replacement
                    var isEqual = _val + "" === val + "";

                    if (isEmpty || isEqual) {
                        var _new_val = formControls[columns[x]].details.displayValues[_val];
                        // if val is something like "@JXcore" , treat it as label from lang definition.
                        if (_new_val.length && _new_val.slice(0, 1) === "@") {
                            _new_val = form_lang.Get(active_user.lang, _new_val.slice(1)) || val;
                        }
                        val = _new_val;
                    }
                }
            }

            if (formControls[columns[x]] && formControls[columns[x]].details && formControls[columns[x]].details.getValue) {
                val = formControls[columns[x]].details.getValue(active_user, record, true);
            }


            // virtual column with plan name
            if (colName === "plan_table_id" && table.name === "domains") {
                var plan = database.getPlanByDomainName(record.name);
                if (plan && plan.name) val = plan.name;
            }

            var str = '<a href="#" onclick="jxEditRow(\'' + record.name + '\'); return false;">' + val + '</a>';
            // no href if there is already one
            if (val && val.indexOf && val.indexOf("onclick") !== -1) str = val;

            if (colName === "_checkbox")
                str = '<input type="checkbox" id="jxrow_' + record.name + '"></input>';
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

exports.getDataTable = function(rows) {

    var cols = rows[0];

    var thead = [];
    var tbody = [];

    for(var rowID in rows) {

        if (rowID + "" === "0") {
            for(var colID in cols) {
                thead.push("<td>" + cols[colID] + "</td>")
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
    {from: "{{datatable.##}}", to: "##", "#": function (val, gl) {
        if (val == "id")
            return gl.name;

        if (val == "buttons") {
            var containerFile = path.join(__dirname, "../definitions/datatables/" + gl.name + "_buttons.html");
            if (fs.existsSync(containerFile)) {
                var txt = fs.readFileSync(containerFile).toString();
                return rep(txt, logic);
            } else
                return "";
        }

        return form_lang.Get(gl.lang, gl[val], true);
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
            path.push(nginxCfg);
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

    var homeDirs = withUserFiles ? getHomePaths(active_user) : null;

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
            if (withUserFiles && homeDirs && homeDirs.users[usersToRemove[o]])
                system_tools.rmdirSync(homeDirs.users[usersToRemove[o]]);
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

    if (!id)
        return { err : form_lang.Get(active_user.lang, "EmptySelection") };

    active_user.session.edits = active_user.session.edits || {};
    active_user.session.edits[table.settings.addForm] = { ID : id };
    active_user.session.edits.lastForm = table.settings.addForm;
    active_user.session.lastPath = "/" + table.settings.addFormURL;

    return {err : false, url : table.settings.addFormURL};
};