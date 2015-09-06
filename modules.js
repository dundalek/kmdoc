
var fs = require('fs'),
    _  = require('underscore'),
    helpers = require('./helpers');

/* == flashcard functionality == */
var flashcard = function(options) {
    this.postprocess(function() {
        var out = flashcard.generate(this.definitions),
            fileOut = options.out || this.options.basename + '-flashcards.csv';

        fs.writeFileSync(fileOut, out);
    });
};

flashcard.csvEsc = function (str) {
    return '"' + String(str).replace(/"/g, '""').replace(/\n/g, '<br>') + '"';
}

flashcard.csvLine = function() {
    return Array.prototype.map.call(arguments, flashcard.csvEsc).join(';');
}

flashcard.generate = function(defs) {
    return defs.map(function(x) {
        return flashcard.csvLine(x.name, x.definition, x.headers.map(helpers.normalizeTag).join(' '));
    }).join('\n');
}

/* == mindmap functionality == */
var markmapParse = require('markmap/parse.markdown');
var markmapTransform = require('markmap/transform.headings');
var SEP = '_-__-_';

function mindmap(options) {
    var fileOut = options.out || this.options.basename + '-mindmap.json';
    this.postprocess(function() {
        var defIndex = {};
        _.each(this.definitions, function(d) {
            var idx = d.headers.join(SEP);
            defIndex[idx] = defIndex[idx] || [];
            defIndex[idx].push({
                name: d.name,
                textId: d.id,
                isDefinition: true
            });
        });
        var root = markmapTransform(markmapParse(this.input));
        traverseMindmap(root, [], defIndex);
        
        fs.writeFileSync(fileOut, JSON.stringify(root, null, '  '));
    });
    options.mindmapUrl = fileOut;
    this.addStyle(this.options.componentsPath+'kmdoc/node_modules/markmap/view.mindmap.css');
    this.addScript(this.options.componentsPath+'kmdoc/node_modules/markmap/node_modules/d3/d3.min.js');
    this.addScript(this.options.componentsPath+'kmdoc/node_modules/markmap/view.mindmap.js');
    this.addScript(this.options.componentsPath+'kmdoc/assets/js/mindmap.js');
    this.addHead('<script>_.extend(KMDoc.modules.mindmap.options, ' + JSON.stringify(options) + ');</script>');
}

function traverseMindmap(node, stack, defIndex) {
    if (node.name) {
        stack.push(node.name);
        var defs = defIndex[stack.join(SEP)];
        if (defs) {
            node.children = node.children || [];
            [].push.apply(node.children, defs);
        }
        if (!node.id) {
            node.textId = helpers.normalizeTag(node.name);
        }
    }
    if (node.children) {
        node.children.forEach(function(child) {
            traverseMindmap(child, stack, defIndex);
        });
    }
    if (node.name) {
        stack.pop();
    }
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
            def = fn.call(self, def);
            var r = /@[^ ]+/;
            if (def.name.match(r)) {
                def.source = helpers.trim(def.name.match(r)[0]).slice(1);
                def.name = helpers.trim(def.name.replace(r, ''));
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
        this.addHead('<script>$(function() {$("body").append("<div id=\\"toc\\"></div>").css("margin-'+side+'", 160); $("#toc").css("'+side+'", 0).toc({offset:-40});});</script>');
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
        var lang = this.options.lang.slice(0,2);
        if (lang === 'cs') {
            this.addScript(this.options.componentsPath+'kmdoc/assets/libs/czech-stemmer/stringbuffer.js');
            this.addScript(this.options.componentsPath+'kmdoc/assets/libs/czech-stemmer/agressive.js');
            this.addScript(this.options.componentsPath+'kmdoc/assets/libs/czech-stemmer/light.js');
            this.addHead('<script>KMDoc.modules.autolink.options.stem = function(str) {return czech_stem(str.toLowerCase());}; </script>');
        } else if (lang in snowballStemmers) {
            this.addScript(this.options.componentsPath+'kmdoc/assets/libs/snowball-js/stemmer/src/Among.js');
            this.addScript(this.options.componentsPath+'kmdoc/assets/libs/snowball-js/stemmer/src/SnowballProgram.js');
            this.addScript(this.options.componentsPath+'kmdoc/assets/libs/snowball-js/stemmer/src/ext/'+snowballStemmers[lang]+'Stemmer.js');
            this.addHead('<script>KMDoc.modules.autolink.options.stem = (function() {var stemmer = new '+snowballStemmers[lang]+'Stemmer(); return function(str) {stemmer.setCurrent(str.toLowerCase()); stemmer.stem(); return stemmer.getCurrent();}})(); </script>');
        }
    },
    /** Enable instant search */
    search: function(options) {
        this.addScript(this.options.componentsPath+'kmdoc/assets/libs/latinize/latinize.js');
        this.addScript(this.options.componentsPath+'kmdoc/assets/js/search.js');
    },
    /** Enable mindmaps */
    mindmap: mindmap
};

var snowballStemmers = {
    'da':'Danish',
    'nl':'Dutch',
    'en':'English',
    'fi':'Finnish',
    'fr':'French',
    'de':'German',
    'hu':'Hungarian',
    'it':'Italian',
    'no':'Norwegian',
    'pt':'Portuguese',
    'ro':'Romanian',
    'ru':'Russian',
    'es':'Spanish',
    'sv':'Swedish',
    'tr':'Turkish'
};
