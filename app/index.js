/*Copyright Nubisa, Inc. 2014. All Rights Reserved*/

var server = require('jxm');
var ms = server.mediaserver;
var template = require("./template_maker");
var smart_replace = require('./smart_search').replace;
var site_defaults = require('./site_defaults');

server.setApplication("JXPanel", "/", "NUBISA_JX_PANEL_2014");

server.addJSMethod("serverMethod", function (env, params) {
    server.sendCallBack(env, params + " World!");
});

server.linkResourcesFromPath("/", "../ui/");


var smart_rule = [
    {from:"{{defaults.$$}}", to:"$$", "$":function(val){ return !site_defaults[val] ? "":site_defaults[val];}}
];

var apply_smart = function(res, data){
    data = smart_replace(data, smart_rule);
    res.write(data);
};

ms.on('.html', function(file, res, cb){
    var temp = template();
    temp.response = res;
    temp.render = apply_smart;
    temp.callback = cb;
    file.pipe(temp);
});

server.start( );
