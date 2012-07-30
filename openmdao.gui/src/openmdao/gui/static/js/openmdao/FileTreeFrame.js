
var openmdao = (typeof openmdao === "undefined" || !openmdao ) ? {} : openmdao ; 

openmdao.FileTreeFrame = function(id,model,code_fn,geom_fn) {
    var menu = [  
        {   "text": "File",
            "items": [
                { "text": "New File",   "onclick": "openmdao.FileTreeFrame.prototype.newFile();" },
                { "text": "New Folder", "onclick": "openmdao.FileTreeFrame.prototype.newFolder();" },
                { "text": "Add Files",  "onclick": "openmdao.FileTreeFrame.prototype.addFile();" }
            ]
        }
    ];
    openmdao.FileTreeFrame.prototype.init.call(this,id,'Files',menu);

    /***********************************************************************
     *  private
     ***********************************************************************/

    // initialize private variables
    var self = this,
        tree = jQuery('<div>')
            .appendTo(self.elm),
        filter_beg = '_.',
        filter_ext = [ 'pyc', 'pyd' ],
        filter_active = true;

    // Enable dropping of files onto file tree frame to add them to project
    self.elm.bind({
        dragenter: function () {
            self.elm.addClass('hover ui-state-highlight');
            return false;
        },
        dragover: function () {
            return false;
        },
        dragleave: function () {
            self.elm.removeClass('hover ui-state-highlight');
            return false;
        },
        dragend: function () {
            self.elm.removeClass('hover ui-state-highlight');
            return false;
        },
        drop: function (e) {
            self.elm.removeClass('hover ui-state-highlight');
            e = e || window.event;
            e.preventDefault();
            e = e.originalEvent || e;

            var i = 0,
                files = (e.files || e.dataTransfer.files);
            for (i = 0; i < files.length; i++) {
                (function (i) {
                    var reader = new FileReader();
                    reader.onload = function (e) {
                       model.setFile(files[i].name,e.target.result);
                    };
                    reader.readAsText(files[i]);
                })(i);
            }
            return false;
        }
    });

    /** recursively build an HTML representation of a JSON file structure */
    function getFileHTML(path,val) {
        // get the file name and extension 
        var path = path.replace(/\\/g,'/'),
            name = path.split('/'),
            name = name[name.length-1],
            ext = name.split('.'),
            ext = ext[ext.length-1],
            url = "application/octet-stream:"+name+":file"+path+"'";

        var html = '';
        if (!filter_active || ((filter_beg.indexOf(name[0])<0 && filter_ext.indexOf(ext)<0))) {
            html = "<li><a";
            if (typeof val === 'object') {    // a folder
                html += " class='folder' path='"+path+"'>"+name+"</a>";
                html += "<ul>";
                jQuery.each(val,function(path,val) {
                    html += getFileHTML(path,val);
                });
                html += "</ul>";
            }
            else {
                html += " class='file' path='"+path+"' draggable='true'"
                     +  " data-downloadurl='"+url+"'>"+name+"</a>";
            }
            html += "</li>";
        }
        else {
            html = '';
        }
        return html;
    }

    /** if we have an edit function, then call it on the specified file */
    function editFile(pathname) {
        if (typeof code_fn === 'function') {
            code_fn(pathname);
        }
        else {
            alert("Edit function is not defined");
        }
    }

    /** display the file in a new window (probably not in a useful format) */
    function viewFile(pathname) {
        openmdao.Util.popupWindow('file'+pathname.replace(/\\/g,'/'),pathname);
    }


    /** if we have a view geometry function, then call it on the specified file */
    function viewGeometry(pathname) {
        if (typeof geom_fn === 'function') {
            geom_fn(pathname);
        }
        else {
            alert("View Geometry function is not defined");
        }
    }

    /** get a context menu for the specified node */
    function contextMenu(node) {
        // first let's see what was clicked on
        var isFolder = false, 
            isEmptyFolder = false;
        if (node.is('.jstree-leaf')) {
            filenode = node.find('.file');
            if (filenode.length === 0) {
                filenode = node.find('.folder');
                if (filenode.length > 0) {
                    isFolder = true;
                    isEmptyFolder = true;
                }
                else {
                    debug.error("FileTreeFrame: leaf node that's not a file or empty folder?",node);
                }
            }
        }
        else {
            filenode = node.find('.folder');
            if (filenode.length > 0) {
                isFolder = true;
                isEmptyFolder = false;
            }
            else {
                debug.error("FileTreeFrame: non-leaf node that's not a folder?",node);
            }
        }

        var path = filenode.attr('path');

        // now create the menu
        var menu = {};

        // if they clicked on a folder then create new files inside that folder
        menu.createFile = {
            "label"  : 'New File',
            "action" : function(node) { 
                           if (isFolder) {
                              openmdao.FileTreeFrame.prototype.newFile(path);
                           }
                           else {
                              openmdao.FileTreeFrame.prototype.newFile();
                           }
                       }
        };
        menu.createFolder = {
            "label"  : 'New Folder',
            "action" : function(node) {
                           if (isFolder) {
                               openmdao.FileTreeFrame.prototype.newFolder(path);
                           }
                           else {
                               openmdao.FileTreeFrame.prototype.newFolder();
                           }
                       }
        };

        menu.addFile = {
            "label"  : 'Add Files',
            "action" : function(node) {
                           if (isFolder) {
                               openmdao.FileTreeFrame.prototype.addFile(path);
                           }
                           else {
                               openmdao.FileTreeFrame.prototype.addFile();
                           }
                       }
        };

        // TODO: implement rename()
        menu.renameFile = {
            "label"  : 'Rename',
            "action" : function(node) { alert("Rename is not implemented yet, sorry :("); }
        };

        // if it's not a folder, 
        if (!isFolder) {
            // view file in another window (TODO: make this useful, e.g. display image, format text or w/e)
            menu.viewFile = {
                "label"  : 'View File (raw)',
                "action" : function(node) { viewFile(path); }
            };
            // let them edit it (TODO: filter out non-text files?)
            menu.editFile = {
                "label"  : 'Edit File',
                "action" : function(node) { editFile(path); }
            };
            // if it's a py file, let them execute it
            if (/.py$/.test(path)) {
                menu.execFile = {
                    "label"  : 'Execute File',
                    "action" : function(node) { model.execFile(path); }
                };
            }
            // if it's a geometry file, let them load it into viewer
            if (/.geom$/.test(path)) {
                menu.viewGeometry = {
                    "label"  : 'View Geometry',
                    "action" : function(node) { viewGeometry('file'+path.replace(/\\/g,'/')); }
                };
            }
        }

        // delete only files and empty folders
        if (!isFolder) {
            menu.deleteFile = {
                "label"  : 'Delete File',
                "action" : function(node) { model.removeFile(path); }
            };
        }
        else if (isEmptyFolder) {
            menu.deleteFolder = {
                "label"  : 'Delete Empty Folder',
                "action" : function(node) { model.removeFile(path); }
            };
        }

        menu.toggle = {
            "label"  : 'Toggle Hidden Files',
            "action" :  function(node) { filter_active = !filter_active; self.update(); }
        };

        return menu;
    }

    /** update the tree from JSON file structure */
    function updateFiles(files) {
        tree.html("<div>Updating...</div>")
            .effect('highlight',{color:'#ffd'},1000);

        // generate HTML for the file tree
        var html = "<ul>";
        jQuery.each(files,function(path,val) {
            html += getFileHTML(path,val);
        });
        html += "</ul>";

        // replace old html
        tree.html(html);

        // convert to a jstree
        tree.jstree({
            "plugins" :     [ "html_data", "sort", "themes", "types", "cookies", "contextmenu", "ui" ],
            "themes" :      { "theme":  "classic" },
            "cookies" :     { "prefix": "filetree", opts : { path : '/' } },
            "contextmenu" : { "items":  contextMenu }
        })
        .bind("loaded.jstree", function (e) {
            jQuery('#'+id+' .file').draggable({ helper: 'clone', appendTo: 'body' });
        })
        .bind("dblclick.jstree", function (e,tree) {
            var node = jQuery(e.target),            
                path = node.attr("path");
            if (node.hasClass('file')) {
                if (/.geom$/.test(path)) {
                    viewGeometry('file'+path.replace(/\\/g,'/'));
                }
                else {
                    editFile(path);
                }
            }
            else if (node.hasClass('folder')) {
                // what do, what do
            }
            else {
                debug.warn("node in file tree does not seem to be a file or a folder:",node);
            }
        });
        
        // enable dragging out to desktop (only supported under chrome)
        // ref: http://www.thecssninja.com/javascript/gmail-dragout
        // FIXME: doesn't work, handlers not getting added??
        tree.find('.file').bind({
            'dragstart': function(e) {
                var url = jQuery(this).attr('data-download-url');
                e.dataTransfer.setData('DownloadURL',url);
                return false;
            }
        })
    }

    function handleMessage(message) {
        if (message.length !== 2 || message[0] !== 'files') {
            debug.warn('Invalid files data:',message);
        }
        else {
            files = message[1];
            updateFiles(files);
        }
    }

    // listen for 'files' messages and update file data accordingly
    model.addListener('files', handleMessage);

    /***********************************************************************
     *  privileged
     ***********************************************************************/

    this.destructor = function() {
        model.removeListener('files', handleMessage);
    };

    /** update the display, with data from the model */
    this.update = function() {
        model.getFiles(updateFiles);
    };

    // load initial file data
    this.update();
};

/** set prototype */
openmdao.FileTreeFrame.prototype = new openmdao.BaseFrame();
openmdao.FileTreeFrame.prototype.constructor = openmdao.FileTreeFrame;

/** create a new file in the current project */
openmdao.FileTreeFrame.prototype.newFile = function(path) {
    openmdao.Util.promptForValue('Specify a name for the new file',
                     function(name) { openmdao.model.newFile(name,path); } );
};

/** create a new folder in the current project */
openmdao.FileTreeFrame.prototype.newFolder = function(path) {
    openmdao.Util.promptForValue('Specify a name for the new folder',
                     function(name) { openmdao.model.newFolder(name,path); } );
};

/** choose & add one or more files, optionally specifying a dest folder */
openmdao.FileTreeFrame.prototype.addFile = function(path) {
    filechooser = jQuery('<input id="filechooser" type="file" multiple="true"' +
                         ' style="position:absolute;top:-500;left:-500" />')
        .appendTo('body');

    function uploadFiles(files, path) {
        var formData = new FormData();
        for (var fileName in files) {
            formData.append('file', files[fileName]);
        }
        // now post a new XHR request
        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'upload');
        xhr.onload = function () {
            if (xhr.status !== 200) {
                debug.error('error uploading files',files,path);
            }
        };
        if (path) {
            formData.append('path', path);
        }
        xhr.send(formData);

        filechooser.remove();  // self destruct, one use only
    }

    filechooser.bind({
        'change': function(e) {
            uploadFiles(this.files, path);
            e.preventDefault();
            e.stopPropagation();
        }
    })

    filechooser.show();
    filechooser.focus();
    if (typeof openmdao_test_mode !== 'undefined') {
        // if testing, make visible for selenium
        filechooser.css({'left':'100px','top':'100px'});
    }
    else {
        filechooser.click();
        filechooser.hide();
    }
};

