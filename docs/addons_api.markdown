# Add-ons API

## File structure

Valid add-on is a zip archive containing at least two files mentioned as followed:

* **package.json** - contains basic information about the add-on,
* **index.js** - the main executable JavaScript file. This is a script file which has to conform API rules described in this documentation.

Obviously an add-on may contain more JavaScript files and they can be utilized by `require()` calls made by *index.js*.

There is one more file, which is not required, but its name is reserved:

* **events.js** - contains definitions for listener methods of various events occurring in JXPanel.

### package.json

Below is sample contents of *package.json* file:

```js
{
    "name": "MongoDB support for JXPanel",
    "id" : "mongodb",
    "version" : "0.0.1",
    "title" : "MongoDB Manager",
    "description" : "MongoDB Manager",
    "adminOnly" : false,
    "port" : "any value"
    "custom" : {
        "value" : "anything"
    }
}
```

Only two of the fields are required:

* **name** - user-readable display name for the add-on visible on add-ons table list..
* **id** - textual id of the add-on. It may contain only digits (0-9), characters (a-z and A-Z) and underscore sign (_).
The id has to be unique among add-ons.

Below are listed other supported, non-required fields:

* **version** - informative version number displayed on add-ons table list.
* **title** - text visible as header on add-on's interface pages. If omitted, the **name** field will be used instead.
* **description** - text, that can be longer than **name** or **title**.
* **adminOnly** - boolean value *true* means, that add-on will not be displayed on add-ons table list for users other than super-user.

You can also use *package.json* file for your own purposes by adding custom fields or objects.
Those values can be easily accessed from your add-on's code, like:

```js
var port = jxpanel.package.json.port;
var custom_value = jxpanel.package.json.custom.value;
```

### index.js

to do this
### events.js

and this