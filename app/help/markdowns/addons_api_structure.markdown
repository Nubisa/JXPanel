# {{linklabel.addons_api_structure}}

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

There is only one method, that *index.js* must expose:

**request(env, args, cb)**

* `env` {object}
* `args` {object}
* `cb` {Function}
    * `err` {object}
    * `html` {string}

The `request()` method is supposed to construct an interface of the add-on's view and return it by invoking `cb` callback.
If callback will not be eventually invoked - the add-on will display na empty page.

There are no standard views to be utilized, however it is very easy to create one by using {{link.addons_api_factory}}.

The `env` object contains various information concerning current request, for example:

```js
{ ClientId: '600a20929axT0@1117894',
  ApplicationName: 'JXPanel',
  SessionID: '20929axT0',
  Index: 1 }
```

It should not be modified and it's only purpose is to pass this object to api methods described in {{link.addons_api_factory}}.

The `args` object contains arguments passed to add-on's request (url) with GET method.

For example:

```
http://[IP]:[PORT]/addon.html?simplest_addon&str11=value&int1=10
```

where *simplest_addon* is an **id** identifier of the add-on (defined in *package.json* file).
For such url the `args` would be parsed into:

```js
{
    _id: 'simplest_addon',
    str11: 'value',
    int1: '10'
}
```

The callback `cb` function receives two arguments: `err` and `html`.
If first one is provided (usually as a string) - it is send back to the browser as an error message.
In any other case, the `html` string is send, which is a rendered add-on's interface and gets displayed in a browser.

You can see sample implementations of an add-on here: {{link.addons_api_tutorials}}.

### events.js

and this

