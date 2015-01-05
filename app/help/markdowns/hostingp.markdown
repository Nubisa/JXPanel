# {{linklabel.hostingp}}

{{linklabel.hostingp}} may be described as sets of various parameters and limits.
Those sets may be then assigned to any sub-users added to JXPanel by the user, who created the set.

For example, super-user creates a hosting plan named *Default* and a user *guest_one*.
The form for creating a user ({{link.adduser}}) contains a {{labelb.PlanID}} ComboBox control,
where the *Default* hosting plan (or any other created later) can be selected and assigned to the user.

## Table list

The table list on {{linklabel.hostingp}} page lists all hosting plans created by currently logged-in user.

{{imgb.hosting_plans_table}}

The number of columns in the table may vary depending on width of the screen.
For example, on mobile devices there may be visible only first two of the columns: {{labelb.PlanName}} and {{labelb.Status}}.

## Adding new hosting plan

There is a button {{btn.AddPlan}} on the top of the {{linklabel.hostingp}} page.

However, in case when the hosting plan to which you belong does not allow to add any plans,
or you already have maximum allowed number of hosting plans ({{labelb.MaxPlans}}) then you will see appropriate error message.

## Editing existing hosting plan

Clicking the chosen row in the table list will get you to the hosting's plan modification form.
It is exactly the same form as {{link.addplan}}, except that it is in edit mode now.

## Removing hosting plans

First column of the table list contains a checkbox for each hosting plan.
To remove a hosting plan, you need to select an appropriate checkbox and then click {{btn.RemoveSelected}} button.

You can also select multiple checkboxes to remove more than one hosting plan at once.

After clicking the button, you will be prompt with a popup window with another buttons:

### {{label.RemoveWithUserFiles}}

The first button {{btn.RemoveWithUserFiles}} as it indicates, deletes everything that was created under the hosting plan, which you are just about to remove.
That includes:

* all {{link.users}} who had the hosting plan assigned, as well as their sub-users,
* all {{link.hostingp}} created by those users (and their sub-users),
* all {{link.domains}} created by those users (and their sub-users).

Also any files located at those user's directories are removed, which means any folders/files created with {{link.filem}},
uploaded by FTP, etc.

### {{label.RemoveWithoutUserFiles}}

Clicking {{btn.RemoveWithoutUserFiles}} button also deletes all database entries created under the hosting plan ({{link.users}} and sub-users, {{link.domains}} and {{link.hostingp}}) but the difference is,
that any files and folders located under each of user's home directory button will be moved to a archive instead of permanent removal.

{{if.admin:true}}
The archive is a folder located in the following path: *server_apps/deleted*. It will contain multiple folders, each for deleted user.
{{endif}}