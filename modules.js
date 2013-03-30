
var fs = require('fs'),
    _  = require('underscore'),
    helpers = require('./helpers');

var flashcard = function(options) {
    this.postprocess(function() {
        var out = flashcard.generate(this.definitions),
            fileOut = options.out || this.fileOut.replace(/\.html$/, '-flashcards.csv');

        fs.writeFileSync(fileOut, out);
    });
};

flashcard.csvEsc = function (str) {
    return '"' + str.replace(/"/g, '""').replace(/\n/g, '<br>') + '"';
}

flashcard.csvLine = function() {
    return Array.prototype.map.call(arguments, flashcard.csvEsc).join(';');
}

flashcard.generate = function(defs) {
    return defs.map(function(x) {
        return flashcard.csvLine(x.name, x.definition, x.headers.map(helpers.normalizeTag).join(' '));
    }).join('\n');
}

/** @exports KMDoc.modules */
module.exports = {
    /** Enable shorter way for definition with double dot */
    shortdef: function() {
        this.preprocess(function() {
            this.input = this.input.replace(/^(.+?) *\.\. */gm, '\n$1\n:');
        });
    },
    /** Allows shorter way to specify source with at-notation */
    shortsource: function(options) {
        var self = this,
            fn = this.transformDef;
        this.transformDef = function(def) {
            def = fn.apply(self, def);
            var r = /@[^ ]+/;
            if (def.name.match(r)) {
                def.source = def.name.match(r)[0];
                def.name = def.name.replace(r, '');
            }
            return def;
        }
    },
    /** Save definitions in CSV file for use as flashcards
        @method */
    flashcard: flashcard,
    /** Enable dynamic table of contents */
    toc: function(options) {
        var side = options.side === 'left' ? 'left' : 'right';
        this.addStyle(this.options.componentsPath+'kmdoc/assets/css/toc.css');
        this.addScript(this.options.componentsPath+'kmdoc/assets/libs/jquery.toc.js');
        this.addHead('<script>$(function() {$("body").append("<div id=\\"toc\\"></div>").css("margin-'+side+'", 160); $("#toc").css("'+side+'", 0).toc();});</script>');
    },
    /** Enable columns displaying */
    columns: function() {
        this.addScript(this.options.componentsPath+'kmdoc/assets/libs/jquery.masonry.min.js');
        this.addScript(this.options.componentsPath+'kmdoc/assets/js/columns.js');
        this.postprocess(function() {
            this.output = this.output
                    .replace(/(<h[1-9])/g, '</div><div class="section">$1')
                    .replace(/<\/div><div class="section">(<h[1-9])/, '<div class="section">$1')
                    .replace(/<\/body>/, '</div></body>');
        });
    },
    /** Enable text-to-speech, useless without tooltip */
    tts: function(options) {
        options = _.extend({
            lang: 'en',
            transform: function(d) {
                return d.name;
            }}, options);
        this.addHead('<script>KMDoc.ttsLang = "'+options.lang+'"</script>');
        this.addScript(this.options.componentsPath+'kmdoc/assets/js/tts.js');
    },
    /** Enable tooltips */
    tooltip: function() {
        this.addScript(this.options.componentsPath+'kmdoc/assets/js/tooltip.js');
    },
    /** Enable rendering of math formulas */
    math: function(options) {
        this.addScript('http://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML');
    },
    /** Enable recall functionality */
    recall: function() {
        this.addScript(this.options.componentsPath+'kmdoc/assets/js/recall.js');
    },
    /** Enable auto-linking */
    autolink: function(options) {
        this.addScript(this.options.componentsPath+'kmdoc/assets/js/autolink.js');
    },
    /** Enable instant search */
    search: function(options) {
        this.addScript(this.options.componentsPath+'kmdoc/assets/js/search.js');
    }
};