/*Copyright Nubisa, Inc. 2014. All Rights Reserved*/

var server = require('jxm');
var render_engine = require('./rendering/render');

server.setApplication("JXPanel", "/", "NUBISA_JX_PANEL_2014");

server.addJSMethod("serverMethod", function (env, params) {
    server.sendCallBack(env, params + " World!");
});

server.linkResourcesFromPath("/", "../ui/");

render_engine.defineRender(server.mediaserver);

server.start( );
