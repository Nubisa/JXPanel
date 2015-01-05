# {{label.JXcoreManagement}}

This is a configuration page accessible only to super-user.

## {{label.JXcoreInfo}}

JXcore is automatically installed by JXpanel installer. In fact, current JXpanel release installs two instances of JXcore:

1. **global** instance, which is used for executing JXpanel itself and is located at */usr/local/bin/jx*,
2. **local** instance, which is used for running users' JavaScript applications.

This block contains information about current **local** JXcore installation: the filesystem path, where JXcore is installed and its version.

There is also a {{btn.Reinstall}} button, which can be used for updating **local** JXcore instace to a newest version.

## {{label.JXcoreMonitor}}

All users' JavaScript application are running through [JXcore Monitor](http://jxcore.com/docs/jxcore-command-monitor.html) - embedded process monitoring tool.
This approach brings multiple benefits:

* **applications stability** - monitor restarts each application whenever it crashes (for example due to improper error handling implemented by user),
* **system security** - monitor spawns user's applications by using unique system's user uid, which implements process isolation and permission access on a system's level,
* **central control** - super-user may easily disable all of the applications with a single click - by stopping the monitor

JXcore Monitor is automatically started during JXpanel installation.

### {{label.JXcoreMonitorStatus}}

The {{label.JXcoreMonitor}} block contains status information about the monitor ({{label.Online}}/{{label.Offline}}) and a button next to it.

When JXcore Monitor is running, there is a {{btn.Stop}} button available.
Please be aware, that if you stop the monitor all the monitored applications will be terminated.

When JXcore Monitor is stopped there is a {{btn.Start}} button available.
Please be aware, that if you start the monitor JXcore enabled applications will be launched.

Enabling/Disabling single application to run with JXcore Monitor can be performed from a {{link.domains}} list (by clicking Start/Stop button for specific domain) or from domain's properties form.

### {{label.JXcoreMonitorAllowMonitorAPI}}

JXcore Monitor offers API available for JXcore application (see JXcore documentation section for [Process Monitor API](http://jxcore.com/docs/jxcore-monitor.html)).
The *{{label.JXcoreMonitorAllowMonitorAPI}}* checkbox allows to globally enable/disable access to `jxcore.monitor` module and its methods for all users' applications.

## {{label.JXcoreConfiguration}}

Changing value of parameters described below (followed by submitting the form with {{btn.Apply}} button) will cause restart of all currently running applications,
since port numbers will need to be recalculated and reassigned for each of the applications.

### {{label.JXcoreAppPortsPerDomain}}

{{label.JXcoreAppPortsPerDomain_Description}}

### Minimum/Maximum app port number

The port range should be greater than domain count multiplied by defined number of ports per domain.

For example, if {{labelb.JXcoreAppPortsPerDomain}} is set to 2, and currently there are 50 domains registered in JXpanel,
then the port range cannot be less than 100 (2x50);
