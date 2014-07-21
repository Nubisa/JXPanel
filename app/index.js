/*Copyright Nubisa, Inc. 2014. All Rights Reserved*/
/*var tools = require('./system_tools');

console.log(jxcore.utils.getOS())
tools.getTop(function(res){
	console.log(res);
});

return;
*/

var server = require('jxm');
var render_engine = require('./rendering/render');
var form_methods = require('./rendering/form_methods');
var charts = require('./definitions/charts/charts');
var site_defaults = require('./definitions/site_defaults');
var _active_users = require('./definitions/active_user');

server.setApplication("JXPanel", "/", "NUBISA_JX_PANEL_2014");

server.setConfig("consoleInfo", true);

server.addJSMethod("serverMethod", function (env, params) {
    server.sendCallBack(env, params + " World!");
});

for(var o in form_methods){
    server.addJSMethod(o, form_methods[o]);
}

site_defaults.defineMethods();
charts.defineChartMethods();
_active_users.defineMethods();

server.linkResourcesFromPath("/", "../ui/");

render_engine.defineRender(server.mediaserver);

server.start();
