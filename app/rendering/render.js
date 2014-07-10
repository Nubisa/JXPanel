var smart_replace = require('./smart_search').replace;
var site_defaults = require('../definitions/site_defaults');
var _active_user = require('../definitions/active_user');
var form_lang = require('../definitions/form_lang');

var takeValue = function(obj, val){
    var active_user = _active_user.getUser("XXX");

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
    {from:"{{defaults.$$}}", to:"$$", "$":function(val){ return takeValue(site_defaults, val);}},
    {from:"{{user.$$}}", to:"$$", "$":function(val){ var active_user = _active_user.getUser("XXX"); return !active_user[val] ? "":active_user[val];}},
    {from:"{{label.$$}}", to:"$$", "$":function(val){ var active_user = _active_user.getUser("XXX"); var res = form_lang.Get(active_user.lang, val); return !res?"":res;}},
    {from:"{{forms.$$}}", to:"$$", "$":function(val){ return _active_user.getForm("XXX", val);}}
];

var apply_smart = function(file, res, data){
    if(!_active_user.hasPermission("XXX", file)){
        res.write(form_lang.Get(active_user.lang, "Access Denied"));
        return;
    }

    data = smart_replace(data, smart_rule);
    res.write(data);
};

exports.defineRender = function(ms){
    ms.on('.html', function(file, res, cb){
        var temp = template();
        temp.response = res;
        temp.render = apply_smart;
        temp.callback = cb;
        temp.file = file.path;
        file.pipe(temp);
    });
};

var Stream = require('stream').Stream;

var template = function() {
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
        stream.render(stream.file, stream.response, stream.cache.join(""));
        stream.callback();
    };

    stream.destroy = function() {
        stream.emit("close");
    };

    return stream;
};