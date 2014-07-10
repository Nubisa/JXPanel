/*Copyright Nubisa, Inc. 2014. All Rights Reserved*/

var server = require('jxm');
var render_engine = require('./rendering/render');
var form_methods = require('./rendering/form_methods');

server.setApplication("JXPanel", "/", "NUBISA_JX_PANEL_2014");

server.setConfig("consoleInfo", true);

server.addJSMethod("serverMethod", function (env, params) {
    server.sendCallBack(env, params + " World!");
});

for(var o in form_methods){
    console.log(o)
    server.addJSMethod(o, form_methods[o]);
}

server.linkResourcesFromPath("/", "../ui/");

render_engine.defineRender(server.mediaserver);

server.start( );
