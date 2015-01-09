# User form

Below is description of all available fields present on the form.

### User Details

- <b>Contact Name</b> - Full name of the user.

	This field is designed to contain a full display name of a user, for example 'John Doe'.

- <b>Status</b>

	Displays an information about user's current status. When the form is in <i>Add</i> mode, this value is empty, otherwise it may display one of the following statuses: <i>Active</i> or <i>Suspended</i>.

- <b>Email Address</b>

- <b>JXPanel language</b>

	Default JXPanel language for the user. It may be changed any time by editing user details or by switching the language on header navigation bar on top of JXPanel page.

- <b>System user name</b> - It has to be unique in scope of the OS. Once created, it cannot be changed.

	This field is editable only when the form is in <i>Add</i> mode.
If provided user does not exist in the OS yet, he/she will be created. Otherwise, when the system user already exists, you will be prompted with a question whether you want to reuse him/her.

- <b>Password</b>

- <b>Repeat password</b>

- <b>Hosting Plan</b> - One of Hosting Plans created by you has to be assigned to the user.

	! This field is readonly when user is editing his/her own profile. Only the parent user can modify this value.
- <b>FTP access</b> - Grants an access to user's home directory by an FTP protocol.

	! This field is readonly when user is editing his/her own profile. Only the parent user can modify this value.
- <b>JXPanel access</b> - When this value is unchecked - user will not be able to log-in into JXPanel.

	When you disable this field for the user while he/she is currently logged-in - his/her session will expire immediately leading to logging out.

	! This field is readonly when user is editing his/her own profile. Only the parent user can modify this value.