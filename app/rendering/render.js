var smart_replace = require('./smart_search').replace;
var site_defaults = require('../definitions/site_defaults');
var _active_user = require('../definitions/active_user');
var datatables = require('./datatable_templates');
var form_lang = require('../definitions/form_lang');
var page_utils = require('./page_utils');
var fs = require('fs');
var pathModule = require('path');
var menu_creator = require('./menu_creator');
var database = require("../install/database");
var hosting_tools = require("../hosting_tools");
var addons_tools = require("../addons_tools");

var takeValue = function(lang, obj, val, active_user){
    if(!obj[lang]){
        obj[lang] = {};
    }

    var lang_exists = obj[lang][val];

    var _lang;
    if(!lang_exists){
        lang_exists = site_defaults["EN"][val];
        _lang = "EN";
    }
    else
        _lang = lang;

    if(!lang_exists)
        return "";
    else
    {
        var call = obj[_lang][val];
        if(call && call.substr){
            return call;
        }
        else if (call){
            return call(_lang, active_user);
        }
        return "";
    }
};

var smart_rule = [
    {from:"{{defaults.$$}}", to:"$$", "$":function(val, gl){
        return takeValue(gl.lang, site_defaults, val, gl.active_user);}
    },
    {from:"{{user.$$}}", to:"$$", "$":function(val, gl){
            if(!gl.active_user){
                return "";
            }

            return !gl.active_user[val] ? "":gl.active_user[val];
        }
    },
    {from:"{{menu.$$}}", to:"$$", "$":function(val, gl){
            if(!gl.active_user){
                return "";
            }
            return menu_creator.render(gl.active_user);
        }
    },
    {from:"{{label.$$}}", to:"$$", "$":function(val, gl){
            var res = form_lang.Get(gl.lang, val);
            return !res?"":res;
        }
    },
    {from:"{{forms.$$}}", to:"$$", "$":function(val, gl){
            return _active_user.getForm(gl.sessionId, val);
        }
    },
    {from:"{{form.##:$$}}", to:"@@", "@!":function(first, second, gl){
        try {
            var activeForm = require('../definitions/forms/' + first).form();
        } catch (ex) {
            return "";
        }

        if(second == "displayName") {
            var isUpdate = _active_user.isRecordUpdating(gl.active_user, activeForm.name);
            var labelAdd = activeForm.displayNameLabel_Add ? activeForm.displayNameLabel_Add : activeForm.name;
            var labelEdit = activeForm.displayNameLabel_Edit ? activeForm.displayNameLabel_Edit : activeForm.name;

            return form_lang.Get(gl.lang, isUpdate ? labelEdit : labelAdd);
        }

        if(second == "title" && activeForm.title)
            return form_lang.Get(gl.lang, activeForm.title, true);

        return activeForm[second] || "";
    }
    },
    {from:"{{charts.$$}}", to:"$$", "$":function(val, gl){
            var cdata = _active_user.getChart(gl.sessionId, val, gl.chart_index);
            gl.chart_index ++;
            return cdata;
        }
    },
    {from:"{{file.$$}}", to:"$$", "$":function(val, gl){
            return gl.file[val];
        }
    },
    {from:"{{toSub.##:$$}}", to:"@@", "@!":function(first, second, gl){
            if(second.indexOf("_")>0){
                gl[first] = "{{" + second.replace("_", ".") + "}}";
                gl.reset = true;
            }
            else{
                var res = form_lang.Get(gl.lang, second);
                res = !res?"":res;
                gl[first] = res;
            }
            return "";
        }
    },
    {from:"{{view.$$}}", to:"$$", "$":function(val, gl){

            val = val.replace(/_/g, "/");

            var fromDB = database.getConfigValue(val);
            var view = fromDB ? fromDB : fs.readFileSync(__dirname + '/../definitions/views/' + val + ".html") + "";
            view = smart_replace(view, smart_rule);

            return view;
        }
    },
    {from:"{{sub.$$}}", to:"$$", "$": function(val,gl){
            var v = "";
            if(gl[val]){
                v = gl[val];
                gl[val] = null;
            }
            return v;
        }
    },
    {from:"{{datatable.$$}}", to:"$$", "$":function(val, gl){
       if (val === "myPlan")
            return datatables.getMyPlanAsTable(gl.active_user);

        return datatables.render(gl.sessionId, val);}
    },
    {from:"{{utils.$$}}", to:"$$", "$":function(val, gl){
            return page_utils[val](gl);
        }
    },
    {from:"{{utils.##:$$}}", to:"@@", "@!":function(first, second, gl) {
        return page_utils[first](second);
    }
    },
    {from:"{{hosting.$$}}", to:"$$", "$":function(val, gl){

        if (val === "appConfig")
            return hosting_tools.appGetConfigAsString(gl.active_user);

        return "";
    }
    },
    {from:"{{lang.$$}}", to:"$$", "$":function(val, gl) {

        if (val === "switch") {
            return form_lang.getSupportedLangs(gl.active_user).html;
        }

        if (val === "supported") {
            return form_lang.getSupportedLangs(gl.active_user).supported;
        }

        if (val === "radios") {
            return form_lang.getLangRadios(gl.active_user);
        }
        return "";
    }
    },
    {from:"{{addons.$$}}", to:"$$", "$":function(val, gl){

//        if (val === "contents")
//            return addons_tools.getContents(gl.active_user);

        return "";
    }},
    {from:"{{if.##:$$}}", to:"@@", "@!":function(first, second, gl) {

        var test = "/" + second + ".html";
        gl.remove_block = {
            end : "{{endif}}"
        };

        if (first === "page")
            gl.remove_block.remove = gl.req.path !== test;

        if (first === "page_not")
            gl.remove_block.remove = gl.req.path === test;

        return "";
    }}
];

var apply_smart = function(file, req, res, data){
//    console.log("apply_smart::SessionId", req.session);
    var sessionId = (!req.session)?null:req.session.id;

    var isUninstalled = _active_user.isPanelUninstalled();

    if (isUninstalled) {
        res.write(isUninstalled);
        return;
    }

    var _user = _active_user.getUser(sessionId);
    var _lang = "EN";
    if(_user && _user.lang)
        _lang = _user.lang;

    if (_user) {
        if (req.path.slice(-5) === ".html") {

            var match = false;
            if (_user.session && _user.session.edits && _user.session.edits.subPages) {

                var subPages = _user.session.edits.subPages;
                if (subPages.indexOf(_user.session.lastPath) !== -1) {
                    for(var o in subPages) {
                        var pair = subPages[o];
                        if (pair.indexOf(req.path) !== -1) {
                            match = true;
                            break;
                        }
                    }
                }
            }

            if (_user.session.lastPath !== req.path && !match) {
                if (_user.session.edits) {
                    var clear = true;
                    if (_user.session.edits.allowPage)
                        clear = _user.session.edits.allowPage !== req.path;

                    if (clear)
                        delete _user.session.edits;
                }

                delete _user.session.forms;
                _user.session.forms = {};
            }
            _user.session.lastPath = req.path;
            _user.session.lastUrl = req.url;
            delete _user.session.status;
        }
    }

    var bname = pathModule.basename(file, ".html");

    smart_rule.globals = {"sessionId":sessionId, "active_user": _user, "lang":_lang, chart_index:0, file:{name:bname}, req : req };

    if(pathModule.extname(file) != '.js' && !_active_user.hasPermission(sessionId, file)){
        if(!_active_user){
            res.write("<html><script>location.href='/index.html?t="+file.replace("../ui/","")+"';</script></html>");
        }
        else{
            res.write("<html><script>location.href='/index.html?"+Date.now()+"';</script></html>");
        }
        return;
    }

    data = smart_replace(data, smart_rule);
    while(smart_rule.globals.reset){
        smart_rule.globals.reset = false;
        data = smart_replace(data, smart_rule);
    }

    res.write(data);
};

exports.defineRender = function(ms){
    ms.on('.html', function(file, req, res, cb){
        var temp = template();
        temp.response = res;
        temp.render = apply_smart;
        temp.callback = cb;
        temp.file = file.path;
        temp.request = req;
        file.pipe(temp);
    });

    ms.on('.js', function(file, req, res, cb){
        var temp = template();
        temp.response = res;
        temp.render = apply_smart;
        temp.callback = cb;
        temp.file = file.path;
        temp.request = req;
        file.pipe(temp);
    });
};

var Stream = require('stream').Stream;


var template = function() {
    database.reloadIfNeeded();
    var stream = new Stream();

    stream.writable = true;
    stream.readable = true;

    stream.cache = [];
    stream.write = function(data) {
        stream.cache.push(data);
        stream.emit("data", data)
    };

    stream.end = function() {
        stream.emit("end");
        stream.render(stream.file, stream.request, stream.response, stream.cache.join(""));
        stream.callback();
    };

    stream.destroy = function() {
        stream.emit("close");
    };

    return stream;
};