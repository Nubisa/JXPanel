var init_file_tools = function(){
    var askPassword = function(username, cb){
        $.SmartMessageBox({
            title : "<strong>" + username.toUpperCase() + ",</strong>",
            content : "And now please provide the password:",
            buttons : "[Cancel][Next]",
            input : "password",
            inputValue: "",
            placeholder : "Password"
        }, function(ButtonPress, passwd) {
            if (ButtonPress == "Cancel") {
                return 0;
            };
            cb(passwd);
        });
    };

    var askURL = function(cb){
        $.SmartMessageBox({
            title : "Clone Repository",
            content : "Enter the link to repository",
            buttons : "[Cancel][Next]",
            input : "text",
            inputValue: "",
            placeholder : "i.e. https://github.com/Nubisa/jxm.git"
        }, function(ButtonPress, link) {
            if (ButtonPress == "Cancel") {
                return 0;
            }
            cb(link);
        });
    };

    var askUsername = function(cb){
        $.SmartMessageBox({
            title : "Clone a Repository",
            content : "Enter your username",
            buttons : "[Cancel][Next]",
            input : "text",
            inputValue: "",
            placeholder : "Leave empty if its a public repository"
        }, function(ButtonPress, username) {
            if (ButtonPress == "Cancel") {
                return 0;
            }
            cb(username);
        });
    };

    var cloneRepo = function(){
        var cloneIt = function(details){
            askURL(function(url){
                if(url && url.length){
                    details.url = url;
                    alert(JSON.stringify(details));
                }
                else{
                    utils.bubble("danger", "Missing URL", "You should enter URL");
                }
            });
        };
        askUsername(function(uname){
            var details = {};
            if(uname && uname.length){
                details.username = uname;
                askPassword(uname, function(password){
                    if(password && password.length){
                        details.password = password;
                        cloneIt(details);
                    }
                    else{
                        utils.bubble("danger", "Missing Password", "You should enter password");
                    }
                });
            }
            else{
                cloneIt(details);
            }
        });
    };

    window.getPathLocation = function(treeId, treeNode){
        var zTree = $.fn.zTree.getZTreeObj(treeId);

        if(!zTree || zTree.jx_loading){
            return false;
        }

        var loc = treeNode.name;
        var _node = treeNode;
        while(_node && _node.parentTId){
            var parent = zTree.getNodeByTId(_node.parentTId);
            if(parent){
                if(parent.name == "/")
                    loc = "/" + loc;
                else
                    loc = parent.name + "/" + loc;
                _node = parent;
            }
            else{
                _node = null;
            }
        }

        return loc;
    };

    var addFile = function(){
        if(!document.treeId)
            return;

        var zTree = $.fn.zTree.getZTreeObj(document.treeId);
        if(!zTree)
            return;
        var nodes = zTree.getSelectedNodes();
        if(!nodes || !nodes.length || !nodes[0].children)
        {
            utils.bubble("warning", "Not Selected!", "Select a folder to add file", 4000);
            return;
        }

        var loc = getPathLocation(document.treeId, nodes[0]);

        $.SmartMessageBox({
            title : "Location : "+loc,
            content : "Create a new ... ?",
            buttons : "[Cancel][Next]",
            input : "select",
            options: "[File][Folder]",
            placeholder : "Select"
        }, function(ButtonPress, selected) {
            if (ButtonPress == "Cancel") {
                return 0;
            }
            $.SmartMessageBox({
                title : "Create a new "+selected + " at "+loc,
                content : "Name ?",
                buttons : "[Cancel][Next]",
                input : "text",
                inputValue: "",
                placeholder : "Name for the "+selected
            }, function(ButtonPress, name) {
                if (ButtonPress == "Cancel") {
                    return 0;
                }
                if(!name || !name.trim().length){
                    utils.bubble("danger", "Can't be empty", "You should define a name", 4000);
                }
                else{
                    jxcore.Call("addFileFolder", {up:loc, name:name, opt:selected}, function(ret_val){
                        if(ret_val.err){
                            alert(ret_val.err.toString());

                            if(ret_val.relogin){
                                location.href = "/index.html";
                            }
                            if(ret_val.reloadTree){
                                location.href = "/codeEditor.html";
                            }
                            return;
                        }
                        if(loc == "/"){
                            loc = "";
                        }
                        utils.bubble("success", selected + " Created", loc + "/" + name, 4000);
                        getFiles(loc, document.treeId, nodes[0]);
                    });
                }
            });
        });
    };


    var removeFile = function(){
        if(!document.treeId)
            return;

        var zTree = $.fn.zTree.getZTreeObj(document.treeId);
        if(!zTree)
            return;

        var nodes = zTree.getSelectedNodes();
        if(!nodes || !nodes.length || !nodes[0].parentTId)
        {
            utils.bubble("warning", "Not Selected!", "Select a folder or a file", 4000);
            return;
        }

        var loc = getPathLocation(document.treeId, nodes[0]);

        $.SmartMessageBox({
            title : "Deleting : "+loc,
            content : "Are you sure ?",
            buttons : "[Yes][No]"
        }, function(ButtonPress, selected) {
            if (ButtonPress == "No") {
                return 0;
            }
            jxcore.Call("removeFileFolder", {up:loc}, function(ret_val){
                if(ret_val.err){
                    alert(JSON.stringify(ret_val.err));

                    if(ret_val.relogin){
                        location.href = "/index.html";
                    }
                    if(ret_val.reloadTree){
                        location.href = "/codeEditor.html";
                    }
                    return;
                }
                utils.bubble("success", "Successfully Deleted", loc, 4000);
                var parent = zTree.getNodeByTId(nodes[0].parentTId);
                loc = getPathLocation(document.treeId, parent);
                getFiles(loc, document.treeId, parent);
            });
        });
    };

    var btn_add = document.getElementById('btn_add');
    var btn_remove = document.getElementById('btn_remove');
    var btn_rename = document.getElementById('btn_rename');
    var btn_clone = document.getElementById('btn_clone');
    var btn_download = document.getElementById('btn_download');

    btn_add.onmousedown = function(){
       addFile();
    };
    btn_remove.onmousedown = function(){
        removeFile();
    };
};