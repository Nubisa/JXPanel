# {{linklabel.jxcoreloginpage}}

Super-user has an ability to customize the login page.
This can be achieved through {{labelb.LoginPage}} tab available under {{link.jxcore}} menu item.

## {{label.Logo}}

The logo image can be customized in JXpanel. The logo is displayed on the {{linklabel.LoginPage}} and also - after
the user successfully logs-in - always at the header (in the left top corner of JXpanel, just above the left menu).
The latter is automatically scaled down to fit the rectangle of 15x75 pixels.

The custom logo image can be uploaded by clicking a {{btn.LogoUpload}}.
The file upload window will pop-up and there you may {{btn.Browse}} for the logo file and finally click the {{btn.Submit}} button.

{{imgb.custom_logo}}

Only the following extensions of a logo file are supported: .gif .png .jpg .jpeg.

Recommended size for uploaded file is 300x60 pixels. Larger images can be uploaded, but will be scaled down to that fit that dimensions.
Please note, that it is not advisable to upload files with extensively higher resolution (e.g. 3000x3000 pixels) or big file size,
since it may affect browser's page refreshing performance.

## {{label.LoginPage}} welcome text

There is a welcome text displayed on the {{label.LoginPage}}, but only for large and medium screens (Desktops ≥ 992 px).

The text can be replaced with any html contents.

By default the following code is displayed:

```html
{{viewplain.customLoginText}}
```

Please note, that the html is fully compatible with [Bootstrap 3](http://www.w3schools.com/bootstrap/) template,
hence you may use all bootstrap features (e.g. predefined classes like `col-xs-12 col-sm-12 col-md-6 col-lg-6` etc.).