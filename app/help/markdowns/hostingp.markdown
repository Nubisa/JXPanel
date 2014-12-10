# {{linklabel.hostingp}}

{{linklabel.hostingp}} may be described as sets of various parameters and limits.
Those sets may be then assigned to any sub-users added to JXPanel by the user, who created the set.

For example, super-user creates a hosting plan named *Default* and a user *guest_one*.
The form for creating a user ({{link.adduser}} contains a {{labelb.PlanID}} combobox,
where the *Default* hosting plan (or any other created later) can be selected and assigned to the user.

## Table list

The table list on {{linklabel.hostingp}} page lists all hosting plans created by currently logged-in user.

{{imgb.hosting_plans_table}}

The number of columns in the table may vary depending on width of the screen.
For example, on mobile devices there may be visible only first two of the columns: {{labelb.PlanName}} and {{labelb.Status}}.

Clicking the chosen row will get you to the hosting's plan modification form.
It is exactly the same form as {{link.addplan}}, except that it is in edit mode now.

## Adding new hosting plan

There is a button {{btn.AddPlan}} on the top of the {{linklabel.hostingp}} page.

However, in case when the hosting plan to which you belong does not allow to add any plans,
or you already have maximum allowed number of hosting plans ({{labelb.MaxPlans}}) then you will see appropriate error message.


