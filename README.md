# HTML email templates

[![Build Status](https://travis-ci.org/tmont/email-template-renderer.png)](https://travis-ci.org/tmont/email-template-renderer)

This is a little library that allows you to easily compile templated HTML
into the pile of hot garbage that HTML email clients require. It makes a
few things easier:

- Writing HTML (by using [Jade](http://jade-lang.com/) or [EJS](https://github.com/tj/ejs))
- Inlining CSS (by using [Juice2](https://github.com/andrewrk/juice)

For example, it will turn this:

```jade
//- /my/templates/examples/test.jade
html
	head
		link(rel="stylesheet", href="./style.css")
	body
		p Hello #{hello}
```

```css
/* style.css */
p {
    color: red;
}
```

into this:

```html
<html>
  <head>
    
  </head>
  <body>
    <p style="color: red;">Hello world</p>
  </body>
</html>
```

by doing this:

```javascript
var Renderer = require('email-template-renderer'),
    renderer = new Renderer('/my/templates', 'jade');
    
renderer.render('examples', { hello: 'world' }, function(err, result) {
    if (err) {
        console.error(err);
        return;
    }
    
    console.log(result.test);
});
```

## Usage
Basically, you have to set up your templates in a particular directory structure.
Something like this:

```
templates
|- reset-password
|-- text.jade
|-- html.jade
|-- style.css
|- registration
|-- text.jade
|-- html.jade
|-- style.css
```

The idea being that each directory (`reset-password` and `registration` above) would contain
different templates. A common theme is to have an HTML template and a text template. You can
use jade/ejs for both. If your template is named `text.<whatever>` it will not be `juice`d.

You would then pass `/path/to/that/templates` directory into the renderer. Then you just call
`render` and give it the name of the template to render as well as any template variables, and
it returns an object with each key being each template inside the template directory.

For example, the result would be something like the following for the `reset-password` template
above:

```javascript
{
    text: 'Click on this link to reset your password: http://example.com/asdf',
    html: '<a style="color: blue; text-decoration: underline;" href="http://example.com/asdf">Click here</a> to reset your password.'
}
```