# File Manager

File Manager is a web-browser based file editor for JXPanel.

It allows to create, edit and delete files and folders - always in scope of currently logged-in user's home directory.

Editor's screen is divided into two parts:

* folder tree (on the left side)
* editor tabs (separate tab for each opened file)

![filem.png](images/filem.png)

There are multiple buttons available at the header bar.

* `Refresh` - Reloads folder tree - refreshes contents of currently selected directory.

* `Add` - Allows to add new file or folder.

* `Delete` - Removes selected file or folder.

* `Rename` - Renames selected file or folder.

* `Download` - Allows to download selected file or folder. New window will appear containing clickable link for downloading the contents which is always packed into a zip archive.

* `Upload` - Allows to upload a local file to currently selected folder.

* `chmod` - Executes chmod command against selected file or folder.

* `Save` - Saves changes made to the file contents opened in editor. This button is enabled only when one of editor's tab is selected and it's contents was modified by the user.