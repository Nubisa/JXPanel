/*Copyright Nubisa, Inc. 2014. All Rights Reserved*/

var server = require('jxm');
var ms = server.mediaserver;
var template = require("./template_maker");

server.setApplication("JXPanel", "/", "NUBISA_JX_PANEL_2014");

server.addJSMethod("serverMethod", function (env, params) {
    server.sendCallBack(env, params + " World!");
});

server.linkResourcesFromPath("/", "../ui/");

server.start( );

var site_defaults = {
    title: "JXPanel"
};

var replacer = function(res, data){

    for(var o in site_defaults)
    {
        data = data.replace(new RegExp("\\$\\{defaults."+o+"\\}\\$", "g"), site_defaults[o]);
    }

    res.write(data);
};

ms.on('.html', function(file, res, cb){
    var temp = template();
    temp.response = res;
    temp.render = replacer;
    temp.callback = cb;
    file.pipe(temp);

});