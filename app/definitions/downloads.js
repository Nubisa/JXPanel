var fs = require('fs');
var pathModule = require('path');
var _active_user = require('./active_user');

var file_list = {}
exports.list = file_list;
exports.check = function(req, res){
    //console.log("..", req.url, req.session);
    if(file_list[req.url]){
        if(!req.session || !req.session.id){
            res.end("Resource is not found");
            return false;
        }
        var active_user = _active_user.getUser(req.session.id);
        if(!active_user){
            res.end("<a href='/index.html'>Click here to login</a>");
        }


    }
    return true;
};