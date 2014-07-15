var smart_replace = require('./smart_search').replace;
var site_defaults = require('../definitions/site_defaults');
var _active_user = require('../definitions/active_user');
var form_lang = require('../definitions/form_lang');
var fs = require('fs');

var takeValue = function(active_user, obj, val){
    if(!obj[active_user.lang]){
        obj[active_user.lang] = {};
    }

    var lang_exists = !obj[active_user.lang][val];
    var lang;
    if(!lang_exists){
        lang_exists = site_defaults["EN"][val];
        lang = "EN";
    }
    else
        lang = active_user.lang;

    if(!lang_exists)
        return "";
    else
        return obj[lang][val];
};

var smart_rule = [
    {from:"{{defaults.$$}}", to:"$$", "$":function(val, gl){
        return takeValue(gl.active_user, site_defaults, val);}
    },
    {from:"{{user.$$}}", to:"$$", "$":function(val, gl){
        var active_user = gl.active_user;
        return !active_user[val] ? "":active_user[val];}
    },
    {from:"{{label.$$}}", to:"$$", "$":function(val, gl){
        var active_user = gl.active_user;
        var res = form_lang.Get(active_user.lang, val);
        return !res?"":res;}
    },
    {from:"{{forms.$$}}", to:"$$", "$":function(val, gl){
        return _active_user.getForm(gl.sessionId, val);}
    },
    {from:"{{toSub.##:$$}}", to:"@@", "@!":function(first, second, gl){
            var active_user = gl.active_user;
            var res = form_lang.Get(active_user.lang, second);
            res = !res?"":res;
            gl[first] = " - " + res;
        }
    },
    {from:"{{view.$$}}", to:"$$", "$":function(val, gl){
            var view = fs.readFileSync(__dirname + '/../definitions/views/' + val + ".html") + "";

            return smart_replace(view, smart_rule);
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
        return _active_user.getDataTable(gl.sessionId, val);}
    },
];

var apply_smart = function(file, req, res, data){
    console.log("apply_smart::SessionId", req.session);
    var sessionId = (!req.session)?null:req.session.id;

    if(!_active_user.hasPermission(sessionId, file)){
        res.write(form_lang.Get("EN", "Access Denied"));
        return;
    }

    smart_rule.globals = {"sessionId":sessionId, "active_user": _active_user.getUser(sessionId, true)};
    data = smart_replace(data, smart_rule);
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
};

var Stream = require('stream').Stream;
var nm = 0;

var template = function() {
    var stream = new Stream();

    stream.writable = true;
    stream.readable = true;
    nm++;
    console.log("OPEN", nm);

    stream.cache = [];
    stream.write = function(data) {
        stream.cache.push(data);
        stream.emit("data", data)
    };

    stream.end = function() {
        stream.emit("end");
        stream.render(stream.file, stream.request, stream.response, stream.cache.join(""));
        nm--;
        console.log("CLOSE", nm);
        stream.callback();
    };

    stream.destroy = function() {
        stream.emit("close");
    };

    return stream;
};