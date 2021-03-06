
var os = require('os'),
	fs = require('fs'),
    _  = require('underscore'),
    marked = require('marked'),
    latinize = require('latinize');

var math_r = /(\\\(.*?[^\\]\\\)|\\\[.*?[^\\]\\\])/g;

/** @exports KMDoc.helpers */
var helpers = {
	/** Convert markdown into html, alias: md */
	markdown: function (str) {
		// explicitly enable math
		str = str.replace(math_r, function(x) {
				return '<span class="math">'+x+'</span>';
		});
		// do the markdown conversion
		return marked(str);
	},
	/** Inline markdown - strip beginning and ending paragraph element */
	imd: function(str) {
		return helpers.markdown(str).replace(/^\s*<p>\s*(.*?)\s*<\/p>\s*$/, '$1');
	},
	/** Escape html */
	html: function(str) {
		return _.escape(str);
	},
	/** Convert string to uppercase */
	upper: function(str) {
		return str.toUpperCase();
	},
	/** Conver string to lowercase */
	lower: function(str) {
		return str.toLowerCase();
	},
	/** Trim whitespace from string */
	trim: function(str) {
        return str.replace(/^\s+|\s+$/g, '');
    },
	/** Convert string to latin characters 
	    @method */
	latinize: latinize,
	/** Converts string to normalized tag */
	normalizeTag: function (str) {
    	return latinize(str)
    			.toLowerCase()
    			.replace(/[^a-z0-9]+/g, '-')
    			.replace(/^-+|-+$/g, '');
	}
};

// alias
helpers.md = helpers.markdown;

module.exports = helpers;