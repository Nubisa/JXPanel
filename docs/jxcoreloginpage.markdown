# Custom Login Page

Super-user has an ability to customize the login page.
This can be achieved through <b>Login page</b> tab available on [JXcore](jxcore.markdown) menu item.

## Logo

The logo image can be customized in JXpanel. The logo is displayed on the  and also - after
the user successfully logs-in - always at the header (in the left top corner of JXpanel, just above the left menu).
The latter is automatically scaled down to fit the rectangle of 15x75 pixels.

The custom logo image can be uploaded by clicking a `Upload logo`.
The file upload window will pop-up and there you may `Browse` for the logo file and finally click the `Submit` button.

![custom_logo.png](images/custom_logo.png)

Only the following extensions of a logo file are supported: .gif .png .jpg .jpeg.

Recommended size for uploaded file is 300x60 pixels. Larger images can be uploaded, but will be scaled down to that fit that dimensions.
Please note, that it is not advisable to upload files with extensively higher resolution (e.g. 3000x3000 pixels) or big file size,
since it may affect browser's page refreshing performance.

## Login page welcome text

There is a welcome text displayed on the Login page, but only for large and medium screens (Desktops ≥ 992 px).

The text can be replaced with any html contents.

By default the following code is displayed:

```html
&lt;div class="hero"&gt;<br>    Welcome...<br><br>&lt;/div&gt;<br><br>&lt;div class="row"&gt;<br>    &lt;div class="col-xs-12 col-sm-12 col-md-6 col-lg-6"&gt;<br>        &lt;h5 class="about-heading"&gt;About SmartAdmin - Are you up to date?&lt;/h5&gt;<br>        &lt;p&gt;Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa.&lt;/p&gt;<br>    &lt;/div&gt;<br>    &lt;div class="col-xs-12 col-sm-12 col-md-6 col-lg-6"&gt;<br>        &lt;h5 class="about-heading"&gt;Not just your average template!&lt;/h5&gt;<br>        &lt;p&gt;Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi voluptatem accusantium!&lt;/p&gt;<br>    &lt;/div&gt;<br>&lt;/div&gt;
```

Please note, that the html is fully compatible with [Bootstrap 3](http://www.w3schools.com/bootstrap/) template,
hence you may use all bootstrap features (e.g. predefined classes like `col-xs-12 col-sm-12 col-md-6 col-lg-6` etc.).