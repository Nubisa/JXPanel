# Dashboard

This is the first screen, which opens up after user logs-in.

It contains couple of informations related with operating system({{label.DiskUsageInformation}}, {{label.SystemInfo}}).

Also, there is table containing actual properties and limits of currently logged user's {{link.hostingp}}.

### {{label.DiskUsageInformation}}

This is a widget, which displays disk usage in form of a round chart for each of the OS's partitions.
Partitions are listed in a ComboBox control - to check particular partition's usage, it needs to be selected from the list.

{{img.disk_usage}}

### {{label.SystemInfo}}

This widget show various information about the system itself, for example:

{{img.system_info}}

### {{label.PlanCurrent}}

Here are shown all parameters and limits defined in user's current hosting plan.
See also {{link.hostingp}}.