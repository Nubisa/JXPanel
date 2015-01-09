# Hosting Plans

Hosting Plans may be described as sets of various parameters and limits.
Those sets may be then assigned to any sub-users added to JXPanel by the user, who created the set.

For example, super-user creates a hosting plan named *Default* and a user *guest_one*.
The form for creating a user ([Add new user](adduser.markdown)) contains a <b>Hosting Plan</b> ComboBox control,
where the *Default* hosting plan (or any other created later) can be selected and assigned to the user.

## Table list

The table list on Hosting Plans page lists all hosting plans created by currently logged-in user.

![hosting_plans_table.png](images/hosting_plans_table.png)

The number of columns in the table may vary depending on width of the screen.
For example, on mobile devices there may be visible only first two of the columns: <b>Plan name</b> and <b>Status</b>.

## Adding new hosting plan

There is a button `Add new hosting plan` on the top of the Hosting Plans page.

Clicking that button will get you to [Add new hosting plan](addplan.markdown) form.

However, in case when the hosting plan to which you belong does not allow to add any plans,
or you already have maximum allowed number of hosting plans (<b>Max plans</b>) then you will see appropriate error message.

## Editing existing hosting plan

Clicking the chosen row in the table list will get you to the hosting's plan modification form.
It is exactly the same form as [Add new hosting plan](addplan.markdown), except that it is in edit mode now.

## Removing hosting plans

First column of the table list contains a checkbox for each hosting plan.
To remove a hosting plan, you need to select an appropriate checkbox and then click `Remove selected` button.

You can also select multiple checkboxes to remove more than one hosting plan at once.

After clicking the button, you will be prompted with a popup window with another buttons:

### Remove everything

The first button `Remove everything` as it indicates, deletes everything that was created under the hosting plan, which you are just about to remove.
That includes:

* all [Users](users.markdown) who had the hosting plan assigned, as well as their sub-users,
* all [Hosting Plans](hostingp.markdown) created by those users (and their sub-users),
* all [Domains](domains.markdown) created by those users (and their sub-users).

Also any files located at those user's directories are removed, which means any folders/files created with [File Manager](filem.markdown),
uploaded by FTP, etc.

### Remove the user, but move user files to the archive

Clicking `Remove the user, but move user files to the archive` button also deletes all database entries created under the hosting plan ([Users](users.markdown) and sub-users, [Domains](domains.markdown) and [Hosting Plans](hostingp.markdown)) but the difference is,
that any files and folders located under each of user's home directory button will be moved to an archive instead of permanent removal.


The archive is a folder located in the following path: *server_apps/deleted*. It will contain multiple folders, each for deleted user.
