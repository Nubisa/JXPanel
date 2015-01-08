/**
 * Created by root on 12/4/14.
 */

// this file converts all markdowns into html files and put them into ui/docs/

var smart_require = jxcore.utils.smartRequire(require);
var marked = smart_require("marked");
var _active_user = require("../definitions/active_user");
var form_lang = require("../definitions/form_lang");
var menu_creator = require("../rendering/menu_creator");
var smart_replace = require('../rendering/smart_search').replace;
var site_defaults = require('../definitions/site_defaults');
var page_utils = require("../rendering/page_utils");
var database = require("../install/database");
var datatables = require('../rendering/datatable_templates');

var fs = require("fs");
var path = require("path");
var server = require("jxm");

var input_dir = path.join(__dirname, "markdowns");
var images_dir = path.join(__dirname, "images");


var renderer = new marked.Renderer();
renderer.heading = function (text, level) {
    if (text.indexOf("<a") === -1 && text.indexOf("{{page") !== -1 && text.indexOf("{{link") !==-1) {
        var anchor = text.toLowerCase().replace(/\s/g, "-");
        var str = anchor ? '<a id="' + anchor + '"></a>' : "";
        return str +'<h' + level + '>' + text + '</h' + level + '>';
    } else {
        return '<h' + level + '>' + text + '</h' + level + '>'
    }
};

//renderer.list = function (text, ordered) {
//    var tag = ordered ? "ol" : "ul";
//    return '<' + tag + ' class="helpMenu">' + text + '</' + tag + '>';
//};

// options.lang == "user"
// - item.denied   -> Plany hostingowe // no url
// - !item.denied  -> <a>Plany Hostingowe</a>
// options.lang == "both"
// - item.denied   -> Hosting Plans (Plany Hostingowe)// no url
// - !item.denied  -> Hosting Plans (<a>Plany Hostingowe</a>)
// add_translation == false
// - item.denied   -> Hosting Plans   // no url
// - !item.denied  -> <a>Hosting Plans</a>
var getLinkForItem = function(active_user, item, options) {

    if (!options) options = {};

    var item_name = null;
    if (typeof item === "string") {
        item_name = item;
        item = menu_creator.getMenuItem(active_user, item);
    }

    if (!item) {
        if (!item_name)
            return "";

        var page = menu_creator.pages[item_name];
        if (!page)
            return item_name;

        item = {
            denied : false,
            name : item_name,
            label : page.label
        }
    }

    var page_name = getPageName(active_user);
    if (page_name == "index") options.lang = "user";

    var fname = path.join(input_dir, item.name + ".markdown");
    var todo = !fs.existsSync(fname);

    var label_lang = form_lang.Get(active_user.lang, item.label, true);
    var label_EN = form_lang.Get("EN", item.label, true);

    var getCase = function(_str) {
        var s = options.lowercase ? _str.toLowerCase() : _str;
        if (todo) s+= " &#40;todo&#41;";
        return s;
    };

    // just return text without link
    if (item.denied || todo)
        return getCase(options.lang == "user" ? label_lang : label_EN);

    var str = "";
    var for_link = "";

    if (options.lang == "user" && active_user.lang !== "EN") {
        if (item.denied) {
            str = getCase(label_lang);
        } else {
            str = "";
            for_link = label_lang
        }
    } else if (options.lang == "both" && active_user.lang !== "EN") {
        if (item.denied) {
            str = getCase(label_EN) + "(" + getCase(label_lang) + ")";
        } else {
            str = getCase(label_EN);
            for_link = label_lang;
        }
    } else {
        // just EN
        if (item.denied) {
            str = getCase(label_EN);
        } else {
            str = "";
            for_link = label_EN
        }
    }

    var ret = str;
    if (for_link) {
        if (options.html && !active_user.for_markdown)
            for_link = '<a href="/help.html?' + item.name + '">' + for_link + '</a>';
        else
            for_link = "[" + for_link + "](" + item.name + ".markdown)";

        // wrapping in brackets
        if (str)
            for_link = " &#40;" + for_link + "&#41;";

        ret += for_link;
    }

    return ret;
};

var markdownToHTML = function (str) {

    // replacing links
    str = str.replace(/\(([\s\S]*?)\.markdown\)/g, "(/help.html?$1)");
    return marked(str, { renderer : renderer, sanitize : false});
};


var getPageName = function(active_user) {

    // e.g. /help.html?dashboard&id=1&par=2
    var tmp = active_user.session.lastUrl.replace(new RegExp("&", "g"), "?").split("?");
    var help_name = tmp[1] || "";

    if (!help_name && tmp[0] === "/help.html")
        help_name = "index";

    return help_name;
};

var getContents = function (active_user) {

    var help_name = getPageName(active_user);

    var md_file = path.join(input_dir, help_name + ".markdown");
    if (!help_name || !fs.existsSync(md_file))
        return { html : form_lang.Get(active_user, "FileNotFound", true) };

    var str = fs.readFileSync(md_file).toString();
    if (!active_user.for_markdown)
        str = markdownToHTML(str);

    smart_rule.globals = { "active_user": active_user };
    str = smart_replace(str, smart_rule);

    if (!active_user.for_markdown)
        str = markdownToHTML(str);

    return { html : str, mainIndex : help_name == "index" };
};

var getImage = function(active_user, val, with_border) {

    var basename = val + ".png";

    var file_name = path.join(images_dir, basename);
    if (!fs.existsSync(file_name))
        return "[image `" + basename + "` not found]";

    if (active_user.for_markdown) {
        return "![" + basename + "](images/" + basename + ")";
    }

    var style = with_border ?  'style="border: solid 1px #ccc; padding: 15px;"' : "";

    var base64 = new Buffer(fs.readFileSync(file_name)).toString('base64');
    return '<img src="data:image/png;base64,' + base64 + '"' + style + '/>';
};

var getButton = function(active_user, val) {

    var str = form_lang.Get(active_user.lang, val, true);

    if (active_user.for_markdown)
        return "`" + str + "`";
    else
        return '<span style="color: #f8f8f8; margin: 0 2px 0 0; padding: 3px 8px 3px 8px; text-align: center; white-space: nowrap; background: #000000; border-radius: 2px; display: inline-block;">' + str + "</span>";
};

exports.defineMethods = function() {

    server.addJSMethod("getHelp", function (env, params) {
        var active_user = _active_user.getUser(env.SessionID);
        if (!active_user) {
            server.sendCallBack(env, {err: form_lang.Get("EN", "Access Denied"), relogin: true});
            return;
        }

        var ret = getContents(active_user);
        if (ret.err) ret.err = form_lang.Get(active_user.lang, ret.err, true);
        server.sendCallBack(env, { err: ret.err, html: ret.html, mainIndex : ret.mainIndex });
    });
};


exports.renderHelpMenu = function(active_user){

    var items = menu_creator.getMenu(active_user);
    var extra_space = active_user.for_markdown ? "\n" : "";

    var str = '';
    for(var o in items) {

        var item = items[o];
        if (item.menu == "main") continue;
        var label = form_lang.Get(active_user.lang, item.label, true);

        var md = "";
        if (item.group)
            md =  extra_space +"### " + label + extra_space;
        else
            md =  "* " + getLinkForItem(active_user, item, { lang : "user" }) + extra_space;

        str += active_user.for_markdown ? md : markdownToHTML(md);
    }

    if (active_user.for_markdown)
        return str;

    return '<div id="jxhelp_menu">\n' + str + "\n</div>";
};


var smart_rule = [
    // gets html code for help menu (all menu items defined in menu_creator)
    {from:"{{helpMenu.$$}}", to:"$$", "$":function(val, gl){
        if(!gl.active_user)
            return "";

        if (val == "menu")
            return exports.renderHelpMenu(gl.active_user);
    }
    },
    {from:"{{label.$$}}", to:"$$", "$":function(val, gl){
        var res = form_lang.Get(gl.lang, val);
        return !res?"":res;
    }
    },
    {from:"{{labelb.$$}}", to:"$$", "$":function(val, gl){
        var res = form_lang.Get(gl.lang, val);
        return !res?"": "<b>"+res+"</b>";
    }
    },
    {from:"{{labeli.$$}}", to:"$$", "$":function(val, gl){
        var res = form_lang.Get(gl.lang, val);
        return !res?"": "<i>"+res+"</i>";
    }
    },
    // gets link to the subpage (defined in menu_creator)
    {from:"{{link.$$}}", to:"$$", "$":function(val, gl){
        return getLinkForItem(gl.active_user, val, { lang : "both", lowercase : true, html : true });
    }
    },
    // gets link to the subpage (not defined in menu_creator)
    {from:"{{page.$$}}", to:"$$", "$":function(val, gl){

        var page = menu_creator.pages[val];
        if (!page)
            return val;

        return getLinkForItem(gl.active_user, val, { lang : "both", lowercase : true, html : true });
    }
    },
    // gets text label for subpage defined in menu_creator)
    {from:"{{linklabel.$$}}", to:"$$", "$":function(val, gl){

        var item = menu_creator.getMenuItem(gl.active_user, val);
        if (!item)
            item = menu_creator.pages[val];

        return item && item.label ? form_lang.Get(gl.active_user, item.label, true) : "";
    }
    },
    {from:"{{if.##:$$}}", to:"@@", "@!":function(first, second, gl) {

        var end = "{{endif}}";
        if (first === "admin")
            gl.remove_block = { end : end, remove : !_active_user.isAdmin(gl.active_user) };

        return "";
    }
    },
    {from:"{{view.$$}}", to:"$$", "$":function(val, gl){

        val = val.replace(/_/g, "/");

        //var fromDB = database.getConfigValue(val);
        var fromDB = null;
        var view = fromDB ? fromDB : fs.readFileSync(__dirname + '/../definitions/views/' + val + ".html") + "";
        view = smart_replace(view, smart_rule);

        return view;
    }
    },
    // view as html
    {from:"{{viewplain.$$}}", to:"$$", "$":function(val, gl){

        val = val.replace(/_/g, "/");

        var view = fs.readFileSync(__dirname + '/../definitions/views/' + val + ".html") + "";
        view = smart_replace(view, smart_rule);

        return view.replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g, "<br>").replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;");
    }
    },
    {from:"{{img.$$}}", to:"$$", "$":function(val, gl){
        return getImage(gl.active_user, val);
    }
    },
    {from:"{{imgb.$$}}", to:"$$", "$":function(val, gl){
        return getImage(gl.active_user, val, true);
    }
    },
    {from:"{{btn.$$}}", to:"$$", "$":function(val, gl){
        return getButton(gl.active_user, val);
    }
    },
    {from:"{{dir.$$}}", to:"$$", "$":function(val, gl){

        var dir = "";
        if (site_defaults[val]) {
            dir = site_defaults[val].replace(path.dirname(site_defaults.apps_folder), "$JXPanel");
        } else {
            dir = "$JXpanel" + path.sep + path.basename(site_defaults.apps_folder) + path.sep + val;
        }

        return "*" + dir + "*";
    }
    },
    {from:"{{url.$$}}", to:"$$", "$":function(val, gl){
        return "help.html?" + val;
    }
    },
    {from:"{{form.$$}}", to:"$$", "$":function(val, gl){
        var fname = path.join(__dirname, '../definitions/forms/', val + ".js");
        if (!fs.existsSync(fname)) return "Unknown Form";

        var form = require(fname).form();

        var out = [];

        for(var o in form.controls) {
            var item = form.controls[o];
            if (item.BEGIN) {
                out.push('### ' +form_lang.Get(gl.active_user, item.BEGIN, true) + "\n");
                continue;
            }

            if (item.name) {
                var label = form_lang.Get(gl.active_user, item.details.label, true);
                var desc = form_lang.Get(gl.active_user, item.details.label + "_Description");

                var str = "- <b>" + label + "</b>";
                if (desc) str += " - " + desc;
                out.push(str + "\n");
            }

            if (item.helpDescription && item.helpDescription.markdown) {
                var str = smart_replace(item.helpDescription.markdown, smart_rule);
                out.push("\t" + str + "\n");
            }

            if (item.details && item.details.cannotEditOwnRecord) {
                out.push("\t! " + form_lang.Get(gl.active_user, "cannotEditOwnRecord", true) );
            }
        }
        var ret = out.join("\n");
        return markdownToHTML(out.join("\n"));
    }
    },
];



exports.renderEntireHelp = function() {

    var files = fs.readdirSync(input_dir);

    var fake_admin = {
        lang : "EN",
        plan : database.unlimitedPlanName,
        for_markdown : true,
        session : {}
    };

    var docs_dir = path.join(__dirname, "../../docs/");
    if (!fs.existsSync(docs_dir))
        fs.mkdirSync(docs_dir);

    for(var f in files) {
        var str = fs.readFileSync(path.join(input_dir, files[f])).toString();

        fake_admin.session.lastUrl = "/help.html?" + path.basename(files[f], ".markdown");

        var ret = getContents(fake_admin);
        if (ret.mainIndex) {
            fs.writeFileSync(path.join(__dirname, "../../README.markdown"), ret.html.replace(/\]\((.+)\.markdown\)/g, "](docs/$1\.markdown)"));
            fs.writeFileSync(path.join(docs_dir, "README.markdown"), ret.html);
        } else {
            fs.writeFileSync(path.join(docs_dir, files[f]), ret.html.replace(/\]\(help.html\?(.+)\)/g, "]($1\.markdown)"));
        }
    }

    // copying pictures
    var cmd = "cp -r " + images_dir + " " + docs_dir + path.sep;
    jxcore.utils.cmdSync(cmd);
};