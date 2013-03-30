
# Cookbook

Here are some suggestions how to extend the system with custom behavior.

## Support for multiple files

KMDoc builder works with one file. If you want to process multiple files in one directory, you can wrap it in a factory method like this:

```javascript
var KMDoc = require('kmdoc');

function buildFile(f) {
	var kmd = KMDoc.create(f);

	// list of used modules
	kmd.use(...);

	// other logic here

	kmd.build();
}

['foo.md', 'bar.md'].forEach(buildFile);

```

## Writing modules

If you want to create custom module, you can register it like:

```javascript
kmd.modules.yourModuleName = function(options) {
	// usually you want to add some styles and scripts for client
	this.addStyle(...);
	this.addScript(...);

	// and maybe you want to hook some preprocessing or postprocessing
	this.preprocess(function() {
		// do preprocessing here
	});
};

kmd.use('yourModuleName');
```

## Add action to tooltip

If you want to link definition to other than default sources (Google, Wikipedia, etc.) you can create custom action.

Create some file, e.g. yourfile.js

```javascript
var tmpl = _.template('<a href="http://www.bing.com/search?q=<%-name%>" title="Search on Bing" target="_blank"><img class="favicon" src="http://www.bing.com/favicon.ico"></a>'');

KMDoc.modules.tooltip.options.actions.push(tmpl);
```

Then add it to build:

```javascript
kmd.addScript('yourfile.js');
```
