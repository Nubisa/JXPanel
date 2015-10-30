# {{linklabel.addons_api_factory}}

This part of documentation contains API reference for creating JXPanel add-on's.

It is assumed, that you are already familiar with {{link.addons_api_structure}} of an add-on.

## API Class Object

To be able to use any API methods by an add-on's code, you need get an instance of the API Class Object first.
This can be done somewhere at the beginning of your add-on's *index.js* file:

```js
var jxpanel = global.getJXPanelAPI(module);
```

This object exposes few method's and properties, from which you can start:

* `getAddonFactory()` - returns an API Factory object containing methods for rendering user interface
    * activeUser
        * isAdmin
        * name
        * getData()
    * db
        * get()
        * getUser()
        * remove()
        * set()
        * suspendUser()
        * unSuspendUser()
        * getHostingPlanCriteria()
    * form
        * events
            * submit
        * addControl()
        * addSection()
        * onSubmitSuccess
        * onSubmitCancel
        * clear()
        * id
        * name
        * render()
    * header
        * addClientButton()
        * addServerButton()
        * renderButtons()
    * html
        * getServerButton()
        * tickMark()
    * render
    * status
        * set()
        * clear()
    * table
        * render()
    * tabs
        * create()
    * translate()
    * url
        * addon
        * addonsList


* `server` - an object containing tools for invoking server-side methods

    * addJSMethod()


* `package` - a property which contains parsed *package.json* file contents

### getAddonFactory()

Returns an API Factory object containing methods for rendering user interface.

#### activeUser

Contains information about a user currently logged into JXPanel which is browsing add-on's pages.

##### isAdmin

Boolean value which indicates whether activeUser is a super-user or not.