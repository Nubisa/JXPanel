# Admin CLI (Command Line Interface)

To be able to launch JXPanel, todo

## Install

## Start

The following command starts JXPanel:

```bash
> jx index.js
```

If everything goes fine, you should see message similar to:

```
jxm.io v0.3.4
HTTP  -> http://192.168.1.102:8000/
```

This informs, that JXPanel from now on is accessible on given url.
IP address and port can be configured in *config.json* file - see [Configuration file](#configuration_file).
Please note, that external IP address should be provided in order to be accessible from wide network.

During the `start` command, JXPanel also tries to launch nginx process as well as ftp server for users access to their home directories.

If nginx fails to start, JXPanel exits immediately, because nginx is a crucial component of JXPanel.
Without it, no application may be accessible per domain.

There are couple of commands, which you can use to try to solve the problem.

Othwerwise, if the problem persists, or you just want to launch JXPanel in diagnostic mode,
you may provide an extra arguments for the `start` command.

```bash
jx index.js diagnostic
```

**Notice!** This command, except ignoring nginx errors, also disables all of



## Configuration file