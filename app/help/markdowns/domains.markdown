# {{linklabel.domains}}

## Table list

The table list on {{linklabel.domains}} page lists all domains and subdomains created by currently logged-in user.

{{imgb.domains}}

The number of columns in the table may vary depending on width of the screen.
For example, on mobile devices there may be visible only one column containing {{labelb.DomainName}} and {{labelb.JXcoreAppStatus}}.

From here you can Start / Stop each of the domains.

## Adding new domain

There is a button {{btn.AddDomain}} on the top of the {{linklabel.domains}} page.

Clicking that button will get you to {{link.adddomain}} form.

However, in case when the hosting plan to which you belong does not allow to add any domains,
or you already have maximum allowed number of domains and subdomains ({{labelb.MaxDomains}}) then you will see appropriate error message.

## Adding new subdomain

To add a second-level domain (subdomain) you can click {{btn.AddSubDomain}} button.

However, in case when the hosting plan to which you belong does not allow to add any domains,
or you already have maximum allowed number of domains and subdomains ({{labelb.MaxDomains}}) then you will see appropriate error message.

Otherwise, the new window will pop-up with list of all available for currently logged-in user domains.
That includes all your first-level domains plus all first-level domains of your parent user.

{{img.add_subdomain}}

Selecting a domain and clicking {{btn.Add}} will get you to {{link.adddomain}} form for adding a second-level domain.
It is exactly the same form as for adding a first-level domain {{link.adddomain}},
except that instead of {{labelb.DomainName}} name you'll need to provide {{labelb.SubDomainName}} name.


## Editing existing domain

Clicking the chosen row in the table list will get you to the domains's modification form.
It is exactly the same form as {{link.adddomain}}, except that it is in edit mode now.

## Removing domains

First column of the table list contains a checkbox for each domain and subdomain.

To remove a domain, you need to select an appropriate checkbox and then click {{btn.RemoveSelected}} button.

You can also select multiple checkboxes to remove more than one domain at once.

After clicking the button, you will be prompted with confirmation question.

Please note that when domain is removed, all file system folder and files related with that domain are also removed.
That means also application files that were located under those folders.