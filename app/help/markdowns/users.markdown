# {{linklabel.users}}

## Table list

The table list on {{linklabel.users}} page lists all users created by currently logged-in user.

Also there is always one extra row for the current logged-in user (pale-yellow background).
This row cannot be deleted from here - only the parent user can do this.

{{imgb.users}}

The number of columns in the table may vary depending on width of the screen.
For example, on mobile devices there may be visible only first two of the columns: {{labelb.UserContactName}} and {{labelb.Status}}.

## Adding new user

There is a button {{btn.AddUser}} on the top of the {{linklabel.users}} page.

Clicking that button will get you to {{link.adduser}} form.

However, in case when the hosting plan to which you belong does not allow to add any users,
or you already have maximum allowed number of users ({{labelb.MaxUsers}}) then you will see appropriate error message.

## Editing existing user

Clicking the chosen row in the table list will get you to the user's modification form.
It is exactly the same form as {{link.adduser}}, except that it is in edit mode now.

## Removing users

First column of the table list contains a checkbox for each user (except for the row containing currently logged-in user,
since no user can remove his/her own account - only the parent user can do this).

To remove a user, you need to select an appropriate checkbox and then click {{btn.RemoveSelected}} button.

You can also select multiple checkboxes to remove more than one user at once.

After clicking the button, you will be prompted with a popup window with another buttons:

### {{label.RemoveWithUserFiles}}

The first button {{btn.RemoveWithUserFiles}} as it indicates, deletes everything that was created under the user account, which you are just about to remove.
That includes:

* all {{link.users}} created by that user, as well as his/her sub-users,
* all {{link.hostingp}} created by that user (and all sub-users),
* all {{link.domains}} created by that user (and all sub-users).

Also any files located at those user's directories are removed, which means any folders/files created with {{link.filem}},
uploaded by FTP, etc.

### {{label.RemoveWithoutUserFiles}}

Clicking {{btn.RemoveWithoutUserFiles}} button also deletes all database entries created under the user ({{link.users}} and sub-users, {{link.domains}} and {{link.hostingp}}) but the difference is,
that any files and folders located under each of user's home directory button will be moved to an archive instead of permanent removal.

{{if.admin:true}}
The archive is a folder located in the following path: *server_apps/deleted*. It will contain multiple folders, each for deleted user.
{{endif}}