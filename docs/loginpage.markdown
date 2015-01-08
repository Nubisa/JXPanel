# Login page

In order to use JXPanel, one needs to successfully log in by providing username and password.
See below for instruction, how to log in as [First user](#first-user).

## Security

JXPanel uses PAM authentication mechanism for user authentication. Therefore no user's password is stored by JXPanel.
Instead, passwords are fully maintained by an operating system.

## Hierarchy structure

JXPanel implements user's hierarchy tree, where each of the users may add sub-users and only he/she may manage them.
Furthermore, each user is granted with [Hosting Plans](hostingp.markdown), which defines various parameters and limits applying to the user and sub-users, as well as sup-plans and sub-domains.

### First user

The first user that logs-in into the JXPanel becomes a **super-user** and is allowed to manage everything else from now on.
Login and password provided on Login page need to match credentials of existing OS's user so it means,
that this user has to exist already in the operating system. However, there is no obligation, that the first user has to be a sudoer.

JXPanel offers some functionalities available only for a super-user, for example: [JXcore](jxcore.markdown), [NPM Wizard](npmw.markdown).

### Regular users

Any other JXPanel's user needs to be created through JXPanel explicitly by already existing user.
See [Add new user](adduser.markdown) for details on that matter.

Once new users are created in JXPanel, they also become an OS's users.


## Customizing login page

Super-user has an ability to customize the login page, for example to set a logo image or define a welcome text.
For more information see [Custom Login Page](jxcoreloginpage.markdown).



