<ul id="addDomain" class="nav nav-tabs bordered"><li class="active" id="tab0"><a href="#tab-pane-tab0" data-toggle="tab"><i class="fa fa-fw fa-align-justify"></i> Domain Details</a></li><li id="tab1"><a href="#tab-pane-tab1" data-toggle="tab"><i class="fa fa-fw fa-align-justify"></i> Third party Apps</a></li></ul><div class="tab-content padding-10"><div class="tab-pane fade in active" id="tab-pane-tab0">
## Domain Details
### Domain Details

- <b>Domain</b> - The domain name.

	This field is not available when the form was invoke for second-level domain (subdomain).

- <b>Subdomain</b> - Please enter only subdomain name (without trailing %s).

	This field is not available when the form was invoke for first-level domain.

- <b>IPv4 address</b> - The IPv4 address on which will be listened requests made for the domain.

	This field contains one ore more IPv4 addresses selected to the hosting plan (to which currently logged-in user belongs) by a parent user. It is possible to choose only one.

- <b>IPv6 address</b> - The IPv6 address on which will be listened requests made for the domain.

	This field is available only in case when the hosting plan, to which currently logged-in user belongs allows at least one of IPv6 addresses to use. It is possible to choose only one IPv6 address from the drop-down list.

### JXcore options

- <b>Application status</b>

	This is read-only field which displays information about domain's application status: whether it is <i>Offline</i> or <i>Running</i>. In either case, there is an appropriate button visible: `Start` or `Stop` respectively. 

- <b>Choose your application</b> - Only one of the applications can run for the domain at a time.

	You can choose between *custom*, *Ghost*, *NodeBB* or *Meteor*.
The *custom* option allows you to run your own application, and so you will need also to specify <b>Custom application file path</b>.
Other options refer to 3-rd party application that can be installed separately per domain.

- <b>Custom application file path</b> - The path is relative to domain root folder. It will be used only if you have chosen the `custom` option above.

	This field is related with *custom* value when selected in the <b>Choose your application</b> field. In this case it is also required.

- <b>Application parameters</b> - Command-line arguments for the application. They will be also visible in `process.argv` property.

- <b>Application`s log web access</b> - Will be available on http://yourdomain.com/jxcore_logs/index.txt

### SSL

Options below can be set only after record is added.

- <b>Enable SSL</b> - When you enable SSL option, no changes in Node application are required. Just keep non-SSL (http) server running in your application, and SSL will be applied automatically with certificate files provided below.

- <b>SSL certificate file</b>

- <b>SSL certificate key file</b>
</div><div class="tab-pane fade" id="tab-pane-tab1">
## Third party Apps
This tab is visible only when form is in Edit mode.

You may have multiple applications installed, but only one can be active at a time.

### Ghost

- <b>Ghost</b>

	Display status of Ghost application - whether it is installed for a domain or not.

### NodeBB

- <b>NodeBB</b>

	Display status of NodeBB application - whether it is installed for a domain or not.

- <b>MongoDB port</b>

- <b>MongoDB database</b>

- <b>MongoDB username</b>

- <b>MongoDB password</b>

### Meteor

- <b>Meteor</b>

	Display status of Meteor application - whether it is installed for a domain or not.
</div></div>