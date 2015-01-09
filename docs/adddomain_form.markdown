<ul id="addDomain" class="nav nav-tabs bordered"><li class="active" id="tab0"><a href="#tab-pane-tab0" data-toggle="tab"><i class="fa fa-fw fa-align-justify"></i> Domain Details</a></li><li id="tab1"><a href="#tab-pane-tab1" data-toggle="tab"><i class="fa fa-fw fa-align-justify"></i> Third party Apps</a></li></ul><div class="tab-content padding-10"><div class="tab-pane fade in active" id="tab-pane-tab0"><h3>Domain Details</h3><ul>
<li><p><b>Domain</b> - The domain name.</p>
<p>  This field is not available when the form was invoke for second-level domain (subdomain).</p>
</li>
<li><p><b>Subdomain</b> - Please enter only subdomain name (without trailing %s).</p>
<p>  This field is not available when the form was invoke for first-level domain.</p>
</li>
<li><p><b>IPv4 address</b> - The IPv4 address on which will be listened requests made for the domain.</p>
<p>  This field contains one ore more IPv4 addresses selected to the hosting plan (to which currently logged-in user belongs) by a parent user. It is possible to choose only one.</p>
</li>
<li><p><b>IPv6 address</b> - The IPv6 address on which will be listened requests made for the domain.</p>
<p>  This field is available only in case when the hosting plan, to which currently logged-in user belongs allows at least one of IPv6 addresses to use. It is possible to choose only one IPv6 address from the drop-down list.</p>
</li>
</ul>
<h3>JXcore options</h3><ul>
<li><p><b>Application status</b></p>
<p>  This is read-only field which displays information about domain&#39;s application status: whether it is <i>Offline</i> or <i>Running</i>. In either case, there is an appropriate button visible: <code>Start</code> or <code>Stop</code> respectively. </p>
</li>
<li><p><b>Choose your application</b> - Only one of the applications can run for the domain at a time.</p>
<p>  You can choose between <em>custom</em>, <em>Ghost</em>, <em>NodeBB</em> or <em>Meteor</em>.
The <em>custom</em> option allows you to run your own application, and so you will need also to specify <b>Custom application file path</b>.
Other options refer to 3-rd party application that can be installed separately per domain.</p>
</li>
<li><p><b>Custom application file path</b> - The path is relative to domain root folder. It will be used only if you have chosen the <code>custom</code> option above.</p>
<p>  This field is related with <em>custom</em> value when selected in the <b>Choose your application</b> field. In this case it is also required.</p>
</li>
<li><p><b>Application parameters</b> - Command-line arguments for the application. They will be also visible in <code>process.argv</code> property.</p>
</li>
<li><p><b>Application`s log web access</b> - Will be available on <a href="http://yourdomain.com/jxcore_logs/index.txt">http://yourdomain.com/jxcore_logs/index.txt</a></p>
</li>
</ul>
<h3>SSL</h3><p>Options below can be set only after record is added.</p>
<ul>
<li><p><b>Enable SSL</b> - When you enable SSL option, no changes in Node application are required. Just keep non-SSL (http) server running in your application, and SSL will be applied automatically with certificate files provided below.</p>
</li>
<li><p><b>SSL certificate file</b></p>
</li>
<li><p><b>SSL certificate key file</b></p>
</li>
</ul>
</div><div class="tab-pane fade" id="tab-pane-tab1">This tab is visible only when form is in Edit mode.

<p>You may have multiple applications installed, but only one can be active at a time.</p>
<h3>Ghost</h3><ul>
<li><p><b>Ghost</b></p>
<p>  Display status of Ghost application - whether it is installed for a domain or not.</p>
</li>
</ul>
<h3>NodeBB</h3><ul>
<li><p><b>NodeBB</b></p>
<p>  Display status of NodeBB application - whether it is installed for a domain or not.</p>
</li>
<li><p><b>MongoDB port</b></p>
</li>
<li><p><b>MongoDB database</b></p>
</li>
<li><p><b>MongoDB username</b></p>
</li>
<li><p><b>MongoDB password</b></p>
</li>
</ul>
<h3>Meteor</h3><ul>
<li><p><b>Meteor</b></p>
<p>  Display status of Meteor application - whether it is installed for a domain or not.</p>
</li>
</ul>
</div></div>