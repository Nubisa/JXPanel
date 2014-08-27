var init_file_tools = function(){
    var addFile = function(){
        if(fileTree.loading)
            return;

        var suspended = "{{user.suspended_txt}}";
        if (suspended){
            utils.jxAddMessage("danger", suspended);
            return;
        }

        var loc = fileTree.path == "" ? "/":fileTree.path;

        $.SmartMessageBox({
            title : "{{label.Location}} : "+loc,
            content : "{{label.CreateNewFileFolder}} ... ?",
            buttons : "[{{label.Cancel}}][{{label.Next}}]",
            input : "select",
            options: "[{{label.File}}][{{label.Folder}}]",
            placeholder : "Select"
        }, function(ButtonPress, selected) {
            if (ButtonPress == "{{label.Cancel}}") {
                return 0;
            }
            if(selected == "{{label.File}}")
                selected = "File";
            else
                selected = "Folder";

            $.SmartMessageBox({
                title : "{{label.CreateNewFileFolder}} "+selected + " -> "+loc,
                content : "{{label.Name}} ?",
                buttons : "[{{label.Cancel}}][{{label.Next}}]",
                input : "text",
                inputValue: "",
                placeholder : "{{label.NameForTheFile}} "+selected
            }, function(ButtonPress, name) {
                if (ButtonPress == "{{label.Cancel}}") {
                    return 0;
                }
                if(!name || !name.trim().length){
                    utils.bubble("danger", "Oops!", "{{label.MustDefineFileFolderName}}", 4000);
                }
                else{
                    fileTree.loading = true;
                    toServer("addFileFolder", {up:loc, name:name, opt:selected}, function(ret_val){
                        fileTree.loading = false;
                        if(ret_val.err){
                            alert($(ret_val.err.toString()).text());

                            if(ret_val.relogin){
                                location.href = "/index.html";
                            }
                            if(ret_val.reloadTree){
                                location.href = "/editor.html";
                            }
                            return;
                        }

                        getFiles(loc == "/" ? "#" : loc);
                        if(loc == "/")
                            loc = "";
                        utils.bubble("success", selected + " {{label.Created}}", loc + "/" + name, 4000);

                    }, true);
                }
            });
        });
    };

    var getParent = function(loc){
        loc = loc.split('/');
        loc = loc.splice(0,loc.length-1);
        if(loc.length){
            loc = loc.join('/');
        }
        else
            loc = "#";

        return loc;
    };


    var removeFile = function(){
        if(fileTree.loading)
            return;

        var loc = fileTree.path == "" ? "/":fileTree.path;
        if(fileTree.activeFile && fileTree.activeFile.length){
            loc = fileTree.activeFile;
        }

        if(loc == '/'){
            utils.bubble("warning", "Opps!", "{{label.CantDeleteRoot}}", 4000);
            return;
        }

        $.SmartMessageBox({
            title : "{{label.DeletingFileFolder}} : "+loc,
            content : "{{label.AreYouSure}}",
            buttons : "[{{label.Yes}}][{{label.No}}]"
        }, function(ButtonPress) {
            if (ButtonPress == "{{label.No}}") {
                return 0;
            }
            fileTree.loading = true;
            jxcore.Call("removeFileFolder", {up:loc}, function(ret_val){
                fileTree.loading = false;
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
                utils.bubble("success", "{{label.FileFolderDeleted}}", loc, 4000);
                if(editors[loc]){
                    editors[loc].host.ax.onclick();
                }
                loc = getParent(loc);
                getFiles(loc);
            }, true);
        });
    };


    var renameFile = function(){
        if(fileTree.loading)
            return;

        var loc = fileTree.path == "" ? "/":fileTree.path;
        if(fileTree.activeFile && fileTree.activeFile.length){
            loc = fileTree.activeFile;
        }

        if(loc == '/'){
            utils.bubble("warning", "Opps!", "{{label.CantRenameRoot}}", 4000);
            return;
        }

        var fname = loc.split('/');
        fname = fname[fname.length-1];
        $.SmartMessageBox({
            title : "{{label.FileFolderRenaming}} : "+loc,
            content : "{{label.EnterNewFileFolderName}}..",
            input: "text",
            inputValue : fname,
            placeHolder: "{{label.EnterNewFileFolderName}}",
            buttons : "[{{label.Submit}}][{{label.Cancel}}]"
        }, function(ButtonPress, name) {
            if (ButtonPress == "{{label.Cancel}}") {
                return 0;
            }
            if(!name || !name.trim().length){
                utils.bubble("danger", "Oops!", "{{label.MustDefineFileFolderName}}", 4000);
                return;
            }

            if(/[\/\\,;:%#@*!]/.test(name) || name.indexOf("..")>=0){
                utils.bubble("warning", "Oops!", "{{label.NoSpecialCharsFileFolderName}}", 4000);
                return;
            }

            var ind = loc.lastIndexOf("/");
            var locTo = loc.substr(0, ind+1);
            locTo += name;

            locTo = locTo.trim();
            loc = loc.trim();

            if(locTo == loc){
                utils.bubble("warning", "Oops!", "{{label.EnteredSameFileFolderName}}", 4000);
                return;
            }

            fileTree.loading = true;
            toServer("renameFileFolder", {up:loc, down:locTo}, function(ret_val){
                fileTree.loading = false;
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
                utils.bubble("success", "{{label.FileFolderRenamed}}", loc + "  to  " + locTo, 4000);
                if(editors[loc]){
                    editors[loc].host.ax.onclick();
                }
                loc = getParent(loc);
                getFiles(loc);
            }, true);
        });
    };


    var refreshTree = function(){
        var loc = fileTree.path == "" ? "#":fileTree.path;
        getFiles(loc);
    };

    var downloadFile = function(){
        if(fileTree.loading)
            return;

        var loc = fileTree.path == "" ? "/":fileTree.path;
        if(fileTree.activeFile && fileTree.activeFile.length){
            loc = fileTree.activeFile;
        }

        if(loc == '/'){
            utils.bubble("warning", "Opps!", "{{label.CantDownloadRoot}}", 4000);
            return;
        }

        fileTree.loading = true;
        toServer("downloadFile", {up:loc}, function(ret_val){
            fileTree.loading = false;
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
                title : "{{label.Download}} : "+loc,
                content : "{{label.LinkToDownload}}<br/><br/>" + downloadLink,
                buttons : "[{{label.Done}}]"
            }, function(ButtonPress) {
                return 0;
            });

        }, true);
    };


    var uploadFile = function(){
        if(fileTree.loading)
            return;

        var loc = fileTree.path == "" ? "/":fileTree.path;
        var uploadHTML = '<span style="background-color: #f2f2f2;color:#000000;padding:10px;display: block;overflow:hidden;">'
            +'<iframe scrolling="no" style="width:98%;height:35px;overflow:hidden;border:none;" src="/uploads.html?#'
            + escape(loc) +'"></iframe></span>';

        $.SmartMessageBox({
            title : "{{label.Upload}} : "+loc,
            content : "{{label.SelectFileToUpload}}<br/><br/>" + uploadHTML,
            buttons : "[{{label.Close}}]"
        }, function(ButtonPress) {
            getFiles(loc);
            return 0;
        });
    };

    var getInfo = function(folder, cb){
        toServer("getFileInfo", {up:folder}, function(ret_val){

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

            cb(ret_val.info, folder);
        }, true);
    };

    var chmod_file = function(){
        if(fileTree.loading)
            return;

        var loc = fileTree.path == "" ? "/":fileTree.path;
        if(fileTree.activeFile && fileTree.activeFile.length){
            loc = fileTree.activeFile;
        }
        if(loc == '/'){
            utils.bubble("warning", "Opps!", "{{label.CantCHMODRoot}}", 4000);
            return;
        }
        fileTree.loading = true;
        getInfo(loc, function(info, path){
            fileTree.loading = false;
            var file_mode = parseInt(info.mode.toString(8), 10) + "";
            if(file_mode.length > 3){
                file_mode = file_mode.substr(file_mode.length-3, 3);
            }
            $.SmartMessageBox({
                title : "{{label.CHMODUpdating}} : "+loc,
                content : "CHMOD..",
                input: "text",
                inputValue :file_mode,
                placeHolder: "chmod",
                buttons : "[{{label.Submit}}][{{label.Cancel}}]"
            }, function(ButtonPress, mode) {
                if(ButtonPress == "{{label.Cancel}}"){
                    return 0;
                }

                mode = mode.trim();

                if(mode == file_mode){
                    utils.bubble("warning", "Opps!", "{{label.DIDNTChangeCHMOD}}", 4000);
                    return;
                }

                var nums = mode.match(/[^0-7]/);

                if(mode.length>3 || nums){
                    utils.bubble("warning", "Opps!", "{{label.CHMODSpecialChars}}", 4000);
                    return;
                }

                fileTree.loading = true;
                toServer("chFile", {up:loc, to:mode}, function(ret_val){
                    fileTree.loading = false;
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

                    utils.bubble("success", "Ok!", "{{label.CHMODisDone}}", 4000);
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