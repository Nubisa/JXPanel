# Users

## Table list

The table list on Users page lists all users created by currently logged-in user.

Also there is always one extra row for the current logged-in user (pale-yellow background).
This row cannot be deleted from here - only the parent user can do this.

![users.png](images/users.png)

The number of columns in the table may vary depending on width of the screen.
For example, on mobile devices there may be visible only first two of the columns: <b>Contact Name</b> and <b>Status</b>.

## Adding new user

There is a button `Add new user` on the top of the Users page.

Clicking that button will get you to [Add new user](adduser.markdown) form.

However, in case when the hosting plan to which you belong does not allow to add any users,
or you already have maximum allowed number of users (<b>Max users</b>) then you will see appropriate error message.

## Editing existing user

Clicking the chosen row in the table list will get you to the user's modification form.
It is exactly the same form as [Add new user](adduser.markdown), except that it is in edit mode now.

## Removing users

First column of the table list contains a checkbox for each user (except for the row containing currently logged-in user,
since no user can remove his/her own account - only the parent user can do this).

To remove a user, you need to select an appropriate checkbox and then click `Remove selected` button.

You can also select multiple checkboxes to remove more than one user at once.

After clicking the button, you will be prompted with a popup window with another buttons:

### Remove everything

The first button `Remove everything` as it indicates, deletes everything that was created under the user account, which you are just about to remove.
That includes:

* all [Users](users.markdown) created by that user, as well as his/her sub-users,
* all [Hosting Plans](hostingp.markdown) created by that user (and all sub-users),
* all [Domains](domains.markdown) created by that user (and all sub-users).

Also any files located at those user's directories are removed, which means any folders/files created with file manager &#40;todo&#41;,
uploaded by FTP, etc.

### Remove the user, but move user files to the archive

Clicking `Remove the user, but move user files to the archive` button also deletes all database entries created under the user ([Users](users.markdown) and sub-users, [Domains](domains.markdown) and [Hosting Plans](hostingp.markdown)) but the difference is,
that any files and folders located under each of user's home directory button will be moved to an archive instead of permanent removal.


The archive is a folder located in the following path: *server_apps/deleted*. It will contain multiple folders, each for deleted user.
