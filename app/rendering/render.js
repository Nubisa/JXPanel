var smart_replace = require('./smart_search').replace;
var site_defaults = require('../definitions/site_defaults');
var active_user = require('../definitions/active_user');
var form_lang = require('../definitions/form_lang');

var takeValue = function(obj, val){
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
    {from:"{{user.$$}}", to:"$$", "$":function(val){ return !active_user[val] ? "":active_user[val];}},
    {from:"{{label.$$}}", to:"$$", "$":function(val){ var res = form_lang.Get(active_user.lang, val); return !res?"":res;}},
    {from:"{{forms.$$}}", to:"$$", "$":function(val){ return active_user.getForm(val);}}
];

var apply_smart = function(res, data){
    data = smart_replace(data, smart_rule);
    res.write(data);
};

exports.defineRender = function(ms){
    ms.on('.html', function(file, res, cb){
        var temp = template();
        temp.response = res;
        temp.render = apply_smart;
        temp.callback = cb;
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
        stream.render(stream.response, stream.cache.join(""));
        stream.callback();
    };

    stream.destroy = function() {
        stream.emit("close");
    };

    return stream;
};