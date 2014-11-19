var fs = require('fs');
var pathModule = require('path');
var _active_user = require('./active_user');
var server = require('jxm');
var form_lang = require('./form_lang');
var addons_tools = require("../addons_tools")
var site_defaults = require("./site_defaults");
var database = require("../install/database");

var formidable = require('formidable'),
    util = require('util');

var file_list = {"/upload":{upload:true}}
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
            res.end("User session is expired");
        }

        var file = file_list[req.url];
        if(file.upload){
            return upload_file(req, res, active_user);
        }else{
            file.count--;
            if(fs.existsSync(file.location)){
                server.mediaserver.pipe(req, res, file.location, null, function(file_path){
                    console.log("unlink", file_path);
                    fs.unlinkSync(file_path);
                });
                return false;
            }
            else{
                delete(file_list[req.url]);
            }
        }
    }
    return true;
};


function upload_file(req, res, user) {
    var form = new formidable.IncomingForm();
    var lang = user.lang;

    var fields = {};
    form
        .on('field', function(field, value) {
            fields[field] = value;
            if(fields["uploadFile"] && fields["target"] && !fields["___"]){
                fields["___"] = true;
                saveFile(fields["uploadFile"] , fields["target"], res, user);
            }
        })
        .on('file', function(field, file) {
            fields[field] = file;
            if(fields["uploadFile"] && fields["target"] && !fields["___"]){
                fields["___"] = true;
                saveFile(fields["uploadFile"] , fields["target"], res, user);
            }
        })
        .on('end', function() {
            if(fields["uploadFile"] && fields["target"] && !fields["___"]){
                saveFile(fields["uploadFile"] , fields["target"], res, user);
            }
            else if(!fields["___"]){
                res.writeHead(200, {'content-type': 'text/plain'});
                res.end(form_lang.Get(lang, "UploadFailed"));
            }
        });
    form.parse(req);

    return false;
}


var saveLogo = function(user, file) {

    if (!_active_user.isAdmin(user))
        return "Access Denied";

    var allowed = [ ".gif", ".png", ".jpg", '.jpeg' ];

    var ext = pathModule.extname(file.name).toLowerCase();
    if (allowed.indexOf(ext) === -1)
        return "LoginPageUnsupportedLogoExtension|" + allowed.join(" ");

    if (!fs.existsSync(site_defaults.dirAdminUploads))
        fs.mkdirSync(site_defaults.dirAdminUploads);

    for(var o in allowed) {
        var f = pathModule.join(site_defaults.dirAdminUploads, "logo_custom" + allowed[o]);
        if (fs.existsSync(f) && allowed[o] !== ext)
            fs.unlinkSync(f);
    }

    var basename = "logo_custom" + ext;
    var fname = pathModule.join(site_defaults.dirAdminUploads, basename);
    fs.writeFileSync(fname, fs.readFileSync(file.path));
    server.linkResourcesFromPath("/img/", site_defaults.dirAdminUploads);
    database.setConfigValue("logo_custom", "/img/" + basename, true);

    return "UploadCompleted";
};


var saveFile = function(file, target, res, user){
    var lang = user.lang;
    var home = user.homeFolder();

    target = unescape(target);
    if(target && target.length && target[0] == '/'){
        target = target.substr(1, target.length-1);
    }

    if (target === "__addon__") {
        addons_tools.install(user, file.path, function(err) {
            res.writeHead(200, {'content-type': 'text/plain'});
            res.end(form_lang.Get(lang, err || "UploadCompleted", true));
        });

        return;
    }

    if (target === "__logo__") {
        var ret = saveLogo(user, file);
        res.writeHead(200, {'content-type': 'text/plain'});
        res.end(form_lang.Get(lang, ret, true));
        return;
    }

    target = home + pathModule.sep + target + pathModule.sep + file.name;

    fs.readFile(file.path, function (err, data) {
        fs.writeFile(target, data, function (err) {
            res.writeHead(200, {'content-type': 'text/plain'});
            res.end(form_lang.Get(lang, "UploadCompleted"));
        });
    });
};