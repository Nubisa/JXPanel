var init_file_tools = function(){
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
            buttons : "[{{label.Cancel}}][{{label.Next}}]",
            input : "select",
            options: "[File][Folder]",
            placeholder : "Select"
        }, function(ButtonPress, selected) {
            if (ButtonPress == "{{label.Cancel}}") {
                return 0;
            }
            $.SmartMessageBox({
                title : "Create a new "+selected + " at "+loc,
                content : "Name ?",
                buttons : "[{{label.Cancel}}][{{label.Next}}]",
                input : "text",
                inputValue: "",
                placeholder : "Name for the "+selected
            }, function(ButtonPress, name) {
                if (ButtonPress == "{{label.Cancel}}") {
                    return 0;
                }
                if(!name || !name.trim().length){
                    utils.bubble("danger", "Can't be empty", "You should define a name", 4000);
                }
                else{
                    toServer("addFileFolder", {up:loc, name:name, opt:selected}, function(ret_val){
                        if(ret_val.err){
                            alert(ret_val.err.toString());

                            if(ret_val.relogin){
                                location.href = "/index.html";
                            }
                            if(ret_val.reloadTree){
                                location.href = "/editor.html";
                            }
                            return;
                        }

                        getFiles(loc, document.treeId, nodes[0]);
                        if(loc == "/")
                            loc = "";
                        utils.bubble("success", selected + " Created", loc + "/" + name, 4000);

                    }, true);
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
            buttons : "[{{label.Yes}}][{{label.No}}]"
        }, function(ButtonPress, selected) {
            if (ButtonPress == "{{label.No}}") {
                return 0;
            }
            jxcore.Call("removeFileFolder", {up:loc}, function(ret_val){
                if(ret_val.err){
                    alert(JSON.stringify(ret_val.err));

                    if(ret_val.relogin){
                        location.href = "/index.html";
                    }
                    if(ret_val.reloadTree){
                        location.href = "/editor.html";
                    }
                    return;
                }
                utils.bubble("success", "Successfully Deleted", loc, 4000);
                if(editors[loc]){
                    editors[loc].host.ax.onclick();
                }
                var parent = zTree.getNodeByTId(nodes[0].parentTId);
                loc = getPathLocation(document.treeId, parent);
                getFiles(loc, document.treeId, parent);
            });
        });
    };


    var renameFile = function(){
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
            title : "Renaming : "+loc,
            content : "Enter a new name..",
            input: "text",
            inputValue : nodes[0].name,
            placeHolder: "enter a new name",
            buttons : "[Submit][Cancel]"
        }, function(ButtonPress, name) {
            if (ButtonPress == "Cancel") {
                return 0;
            }
            if(!name || !name.trim().length){
                utils.bubble("warning", "Enter a name..", "Name can not be empty!", 4000);
                return;
            }

            if(/[\/\\,;:%#@*!]/.test(name) || name.indexOf("..")>=0){
                utils.bubble("warning", "Enter a name..", "Name can not contain special characters!", 4000);
                return;
            }

            var ind = loc.lastIndexOf("/");
            var locTo = loc.substr(0, ind+1);
            locTo += name;

            locTo = locTo.trim();
            loc = loc.trim();

            if(locTo == loc){
                utils.bubble("warning", "Enter a name..", "You have entered the same name!", 4000);
                return;
            }

            toServer("renameFileFolder", {up:loc, down:locTo}, function(ret_val){
                if(ret_val.err){
                    alert(JSON.stringify(ret_val.err));

                    if(ret_val.relogin){
                        location.href = "/index.html";
                    }
                    if(ret_val.reloadTree){
                        location.href = "/editor.html";
                    }
                    return;
                }
                utils.bubble("success", "Successfully Renamed", loc + "  to  " + locTo, 4000);
                if(editors[loc]){
                    editors[loc].host.ax.onclick();
                }
                var parent = zTree.getNodeByTId(nodes[0].parentTId);
                loc = getPathLocation(document.treeId, parent);
                getFiles(loc, document.treeId, parent);
            }, true);
        });
    };


    var refreshTree = function(){
        if(!document.treeId)
            return;

        var zTree = $.fn.zTree.getZTreeObj(document.treeId);
        if(!zTree)
            return;

        var nodes = zTree.getSelectedNodes();
        if(!nodes || !nodes.length || !nodes[0].children)
        {
            utils.bubble("warning", "Not Selected!", "Select a folder to refresh", 4000);
            return;
        }

        var loc = getPathLocation(document.treeId, nodes[0]);
        getFiles(loc, document.treeId, nodes[0]);
    };

    var downloadFile = function(){
        if(!document.treeId)
            return;

        var zTree = $.fn.zTree.getZTreeObj(document.treeId);
        if(!zTree)
            return;

        var nodes = zTree.getSelectedNodes();
        if(!nodes || !nodes.length)
        {
            utils.bubble("warning", "Not Selected!", "Select a folder or a file to download", 4000);
            return;
        }

        var loc = getPathLocation(document.treeId, nodes[0]);
        if(loc == '/'){
            utils.bubble("warning", "Opps!", "You can not download the root folder", 4000);
            return;
        }
        toServer("downloadFile", {up:loc}, function(ret_val){
            if(ret_val.err){
                alert(JSON.stringify(ret_val.err));

                if(ret_val.relogin){
                    location.href = "/index.html";
                }
                if(ret_val.reloadTree){
                    location.href = "/editor.html";
                }
                return;
            }

            var downloadLink = "<a href='"+ret_val.link+"' target='_blank'>"+ret_val.name+"</a>";

            $.SmartMessageBox({
                title : "Download : "+loc,
                content : "Use below one-time link to download..<br/><br/>" + downloadLink,
                buttons : "[Done]"
            }, function(ButtonPress, name) {
                return 0;
            });

        }, true);
    };


    var uploadFile = function(){
        if(!document.treeId)
            return;

        var zTree = $.fn.zTree.getZTreeObj(document.treeId);
        if(!zTree)
            return;

        var nodes = zTree.getSelectedNodes();
        if(!nodes || !nodes.length || !nodes[0].children)
        {
            utils.bubble("warning", "Not Selected!", "Select a folder for upload location", 4000);
            return;
        }

        var loc = getPathLocation(document.treeId, nodes[0]);
        var uploadHTML = '<span style="background-color: #f2f2f2;color:#000000;padding:10px;display: block;overflow:hidden;">'
            +'<iframe scrolling="no" style="width:98%;height:35px;overflow:hidden;border:none;" src="/uploads.html?#'
            + escape(loc) +'"></iframe></span>';

        $.SmartMessageBox({
            title : "Download : "+loc,
            content : "Select a file to upload..<br/><br/>" + uploadHTML,
            buttons : "[Close]"
        }, function(ButtonPress, name) {
            getFiles(loc, document.treeId, nodes[0]);
            return 0;
        });
    };

    var getInfo = function(folder, treeNode, cb){
        toServer("getFileInfo", {up:folder, id:document.treeId}, function(ret_val){

            if(ret_val.err){
                alert("ERROR : " + JSON.stringify(ret_val.err));
                if(ret_val.relogin){
                    location.href = "/index.html";
                }
                var zTree = $.fn.zTree.getZTreeObj(ret_val.id);
                if(zTree)
                    zTree.jx_loading = false;
                return;
            }

            cb(ret_val.info, folder, ret_val.id, treeNode);
        }, true);
    };

    var chmod_file = function(){
        if(!document.treeId)
            return;

        var zTree = $.fn.zTree.getZTreeObj(document.treeId);
        if(!zTree)
            return;

        var nodes = zTree.getSelectedNodes();
        if(!nodes || !nodes.length)
        {
            utils.bubble("warning", "Not Selected!", "Select a folder or a file to update chmod", 4000);
            return;
        }

        var loc = getPathLocation(document.treeId, nodes[0]);
        if(loc == '/'){
            utils.bubble("warning", "Opps!", "You can not change the root folder", 4000);
            return;
        }
        getInfo(loc, nodes[0], function(info, path, treeId, treeNode){
            var file_mode = parseInt(info.mode.toString(8), 10) + "";
            if(file_mode.length > 3){
                file_mode = file_mode.substr(file_mode.length-3, 3);
            }
            $.SmartMessageBox({
                title : "Renaming : "+loc,
                content : "Enter a new name..",
                input: "text",
                inputValue :file_mode,
                placeHolder: "enter a new name",
                buttons : "[{{label.Submit}}][{{label.Cancel}}]"
            }, function(ButtonPress, mode) {
                if(ButtonPress == "{{label.Cancel}}"){
                    return 0;
                }

                mode = mode.trim();

                if(mode == file_mode){
                    utils.bubble("warning", "Opps!", "You didn't change the file mode", 4000);
                    return;
                }

                var nums = mode.match(/[^0-7]/);

                if(mode.length>3 || nums){
                    utils.bubble("warning", "Opps!", "File Mode needs to be a three digit number (0-7)", 4000);
                    return;
                }

                toServer("chFile", {up:loc, to:mode}, function(ret_val){
                    if(ret_val.err){
                        alert(JSON.stringify(ret_val.err));

                        if(ret_val.relogin){
                            location.href = "/index.html";
                        }
                        if(ret_val.reloadTree){
                            location.href = "/editor.html";
                        }
                        return;
                    }

                    utils.bubble("success", "Ok!", "File mode updated successfully", 4000);
                }, true);
            });
        });
    };

    var btn_add = document.getElementById('btn_add');
    var btn_remove = document.getElementById('btn_remove');
    var btn_rename = document.getElementById('btn_rename');
    var btn_refresh = document.getElementById('btn_refresh');
    var btn_download = document.getElementById('btn_download');
    var btn_upload = document.getElementById('btn_upload');
    var btn_chmod = document.getElementById('btn_chmod');

    btn_add.onmousedown = function(){
       addFile();
    };
    btn_remove.onmousedown = function(){
        removeFile();
    };
    btn_rename.onmousedown = function(){
        renameFile();
    };
    btn_refresh.onmousedown = function(){
        refreshTree();
    };
    btn_download.onmousedown = function(){
        downloadFile();
    };
    btn_upload.onmousedown = function(){
        uploadFile();
    };
    btn_chmod.onmousedown = function(){
        chmod_file();
    };
};