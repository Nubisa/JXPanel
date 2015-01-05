# {{linklabel.npmw}}

Super-user may install NPM modules, which will be accessible for all Node.JS/JXcore applications installed by JXpanel users.

The modules are not installed globally, as would `jx install -g module_name` command would do.
Instead, they are installed into the following path: {{dir.dirNativeModules}}.

However, they can be still accessed from a JavaScript application as any other modules:

```js
var mod = require("module_name");
```

## Table list

The table list contains all NPM modules installed by super-user so far.

## Installing NPM module

A new module can be installed by clicking {{btn.JXcoreNPMAddModule}} button, which can be found at the top of the table list.
The new window will pop-up with a text field, where you can type a name of the module, which you want to install.

### Module version

You can also specify a version number for the NPM module followed by **@** sign.
For example, to install *express* module 3.18.6, you can type a name: *express@3.18.6*.

Please note that if there is already NPM module installed with the same name - it is always overwritten without a warning.
This is an expected behaviour. If you are installing NPM module without specifying its version (e.g.: *express*) - always the currently newest
version from NPM repository is installed.

On the other hand, when you specify module's version (e.g.: *express@3.18.6*) - it will overwrite existing one, even if it was newer before.

## Removing NPM modules

First column of the table list contains a checkbox for each NPM module.
To remove an module, you need to select an appropriate checkbox and then click {{btn.RemoveSelected}} button.

You can also select multiple checkboxes to remove more than one module at once.
