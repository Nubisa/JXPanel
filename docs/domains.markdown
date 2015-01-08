# Domains

## Table list

The table list on Domains page lists all domains and subdomains created by currently logged-in user.

![domains.png](images/domains.png)

The number of columns in the table may vary depending on width of the screen.
For example, on mobile devices there may be visible only one column containing <b>Domain</b> and <b>Application status</b>.

From here you can Start / Stop each of the domains.

## Adding new domain

There is a button `Add new domain` on the top of the Domains page.

Clicking that button will get you to adddomain form.

However, in case when the hosting plan to which you belong does not allow to add any domains,
or you already have maximum allowed number of domains and subdomains (<b>Max domains</b>) then you will see appropriate error message.

## Adding new subdomain

To add a second-level domain (subdomain) you can click `Add new subdomain` button.

However, in case when the hosting plan to which you belong does not allow to add any domains,
or you already have maximum allowed number of domains and subdomains (<b>Max domains</b>) then you will see appropriate error message.

Otherwise, the new window will pop-up with list of all available for currently logged-in user domains.
That includes all your first-level domains plus all first-level domains of your parent user.

![add_subdomain.png](images/add_subdomain.png)

Selecting a domain and clicking `Add` will get you to adddomain form for adding a second-level domain.
It is exactly the same form as for adding a first-level domainadddomain,
except that instead of <b>Domain</b> you'll need to provide <b>Subdomain</b>.


## Editing existing domain

Clicking the chosen row in the table list will get you to the domains's modification form.
It is exactly the same form as adddomain, except that it is in edit mode now.

## Removing domains

First column of the table list contains a checkbox for each domain and subdomain.

To remove a domain, you need to select an appropriate checkbox and then click `Remove selected` button.

You can also select multiple checkboxes to remove more than one domain at once.

After clicking the button, you will be prompted with confirmation question.

Please note that when domain is removed, all file system folder and files related with that domain are also removed.
That means also application files that were located under those folders.