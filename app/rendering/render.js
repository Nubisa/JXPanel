var smart_replace = require('./smart_search').replace;
var site_defaults = require('../definitions/site_defaults');
var _active_user = require('../definitions/active_user');
var form_lang = require('../definitions/form_lang');
var page_utils = require('./page_utils');
var fs = require('fs');

var takeValue = function(lang, obj, val){
    if(!obj[lang]){
        obj[lang] = {};
    }

    var lang_exists = !obj[lang][val];

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
        return obj[_lang][val];
};

var smart_rule = [
    {from:"{{defaults.$$}}", to:"$$", "$":function(val, gl){
        return takeValue(gl.lang, site_defaults, val);}
    },
    {from:"{{user.$$}}", to:"$$", "$":function(val, gl){
        var active_user = gl.active_user;
        if(!active_user){
            return "";
        }

        return !active_user[val] ? "":active_user[val];}
    },
    {from:"{{label.$$}}", to:"$$", "$":function(val, gl){
        var res = form_lang.Get(gl.lang, val);
        return !res?"":res;}
    },
    {from:"{{forms.$$}}", to:"$$", "$":function(val, gl){
        return _active_user.getForm(gl.sessionId, val);}
    },
    {from:"{{toSub.##:$$}}", to:"@@", "@!":function(first, second, gl){
            var res = form_lang.Get(gl.lang, second);
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
    {from:"{{utils.$$}}", to:"$$", "$":function(val, gl){
            return page_utils[val](gl);
        }
    }
];

var apply_smart = function(file, req, res, data){
    console.log("apply_smart::SessionId", req.session);
    var sessionId = (!req.session)?null:req.session.id;

    var _user = _active_user.getUser(sessionId);
    var _lang = "EN";
    if(_user && _user.lang)
        _lang = _user.lang;

    smart_rule.globals = {"sessionId":sessionId, "active_user": _user, "lang":_lang};

    if(!_active_user.hasPermission(sessionId, file)){
        res.write("<html><script>location.href='/index.html';</script></html>");
        return;
    }

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