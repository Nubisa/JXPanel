# Hosting Plan form

Below is description of all available fields present on the form.

### General

- <b>Plan name</b> - Once the plan is created, you will not be able to change it's name.

- <b>Status</b>

	Displays an information about hosting plan's current status. When the form is in <i>Add</i> mode, this value is empty, otherwise it may display one of the following statuses: <i>Active</i> or <i>Suspended</i>.

### Hosting Plan Limits

- <b>Disk space</b> - Maximum disk usage (MB). Empty value disables the limit.

- <b>Traffic</b> - Maximum amount of transferred data during given period of time. Empty value disables the limit.

- <b>Max domains</b> - Maximum amount of domains. Value 0 disables adding new domains.

- <b>Max users</b> - Maximum amount of users. Value 0 disables adding new users.

- <b>Max plans</b> - Maximum amount of hosting plans. Empty value disables the limit. Value 0 disables adding new plans.

### JXcore application options

- <b>Max memory limit</b> - Maximum size of memory (kB), which can be allocated by the application. Empty value disables the limit.

- <b>Max CPU</b> - Maximum CPU usage (percentage) allowed for the application. Empty value disables the limit.

- <b>CPU check interval</b> - Interval (seconds) of Max CPU usage check. Default value is 2.

- <b>Allow custom socket port</b>

- <b>Allow to spawn/exec child processes</b>

- <b>Allow to call local native modules</b>

### System options

- <b>SSH</b> - Enables access to Remote Management console accessible from browser.

- <b>NGINX directives</b> - Here you can specify the settings for the nginx reverse proxy server that runs in front of Apache. Use the same syntax as you use for nginx.conf. For example, if you want to pack all the proxied requests with gzip, add the line: 'gzip_proxied any;'.

	Each of the domains configured in JXPanel has its own configuration file for NGINX.Within this file domain is defined inside of [server](http://nginx.org/en/docs/http/ngx_http_core_module.html#server) block tag and these extra directives are added at the end of it.

- <b>IPv4 addresses</b> - Please choose, which IPv4 addresses will be available for the hosting plan.

	This field contains one ore more IPv4 addresses selected to the hosting plan (to which currently logged-in user belongs) by a parent user.

- <b>IPv6 addresses</b> - Please choose, which IPv6 addresses will be available for the hosting plan.

	This field is available only in case when the hosting plan, to which currently logged-in user belongs allows at least one of IPv6 addresses to use.

	If you are superuser, and you don't see this field, it means that the current server does not expose any public IPv6 addresses.


### Addons' settings

This tab is available only in case when there are any addon's installed on JXPanel (see add-on manager &#40;todo&#41;) which expose additional maximums for the hosting plan.