/**
 * Created by root on 10/13/14.
 */


var addons_tools = require("./addons_tools");

exports.call = function(active_user, event_name, args) {

    addons_tools.callEvent(event_name, args);
};