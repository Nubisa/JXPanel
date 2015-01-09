# {{linklabel.addonm}}

Add-ons for JXPanel are modules which can be written in JavaScript. Anyone can write an add-on, but only super-user can install them to JXPanel.

See {{link.addons_api}} for documentation on how to write an add-on.

Add-ons may extend JXPanel features, for example add additional criteria for Hosting Plans or introduce support for databases, for example mongodb.

## Table list

The table list contains all add-ons installed by super-user so far.

{{imgb.addonm}}

The number of columns in the table may vary depending on width of the screen.
For example, on mobile devices there may be visible only first two of the columns: {{labelb.name}} and {{labelb.version}}.

Clicking an add-on on the table list will get you to the add-on's configuration page.
Each add-on may offer different interface because it entirely depends on add-ons authors.

{{if.admin:true}}
## Installing add-on

A new add-on can be installed by clicking {{btn.AddOnAddNew}} button, which can be found at the top of the table list.
The file upload window will pop-up and there you may {{btn.Browse}} for the add-on file (zip) and finally click the {{btn.Submit}} button.

There are multiple checks performed, whether the chosen file is a valid add-on zip archive.

## Removing add-ons

First column of the table list contains a checkbox for each add-on.
To remove an add-on, you need to select an appropriate checkbox and then click {{btn.RemoveSelected}} button.

You can also select multiple checkboxes to remove more than one add-on at once.
{{endif}}