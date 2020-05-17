// for sqlite wrapper
require('babel-polyfill');

var fs = require('fs-promise'),
    path = require('path'),
    _  = require('underscore'),
    sqlite = require('sqlite/legacy'),
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
var markmapParse = require('markmap/lib/parse.markdown');
var markmapTransform = require('markmap/lib/transform.headings');
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
    this.addStyle(this.options.componentsPath+'kmdoc/node_modules/markmap/style/view.mindmap.css');
    this.addScript(this.options.componentsPath+'kmdoc/node_modules/d3/d3.min.js');
    this.addScript(this.options.componentsPath+'kmdoc/node_modules/markmap/lib/d3-flextree.js');
    this.addScript(this.options.componentsPath+'kmdoc/node_modules/markmap/lib/view.mindmap.js');
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

/* == docset functionality == */
var docsetTmpl = _.template(`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CFBundleIdentifier</key>
	<string>cheatsheet</string>
	<key>CFBundleName</key>
	<string><%= title %></string>
	<key>DashDocSetFamily</key>
	<string>cheatsheet</string>
	<key>DashDocSetKeyword</key>
	<string><%= name %></string>
	<key>DashDocSetPluginKeyword</key>
	<string><%= name %></string>
	<key>DocSetPlatformFamily</key>
	<string>cheatsheet</string>
	<key>dashIndexFilePath</key>
	<string><% indexPath %></string>
	<key>isDashDocset</key>
	<true/>
</dict>
</plist>
`);

function docset(options) {
    this.postprocess(function() {
        const name = (options.name || this.options.basename);
        const docpath = name + '.docset';
        const indexPath = 'index.html';
        var db;

        fs.exists(docpath)
          .then((exists) => {
            if (exists) {
              return fs.remove(docpath);
            }
          })
          .then(() => fs.mkdirp(docpath + '/Contents/Resources/Documents/styles'))
          .then(() => fs.writeFile(docpath + '/Contents/Info.plist', docsetTmpl({
            title: this.options.title,
            name: name,
            indexPath: indexPath,
          })))
          .then(() => {
            // only keep stylesheets for static view
            const styles = this._head.filter(x => x.type === 'style');
            this._head = styles.map((x, i) => ({
              type: x.type,
              value: x.value.match(/^https?:\/\//) ? x.value : './styles/' + i + '-' + path.basename(x.value),
            }));
            return Promise.all(styles.map((style, i) => {
              if (!style.value.match(/^https?:\/\//)) {
                return fs.copy(style.value, docpath + '/Contents/Resources/Documents/' + this._head[i].value);
              }
            }));
          })
          .then(() => {
            const staticOutput = this.options.fileTmpl({
                options: this.options,
                head: this._buildAssets(),
                content: this._applyHelpers(this.input, ['md'])
            });
            return fs.writeFile(docpath + '/Contents/Resources/Documents/' + indexPath, staticOutput);
          })
          .then(() => sqlite.open(docpath + '/Contents/Resources/docSet.dsidx'))
          .then(result => db = result)
          .then(() => db.run('CREATE TABLE searchIndex(id INTEGER PRIMARY KEY, name TEXT, type TEXT, path TEXT);'))
          .then(() => db.run('CREATE UNIQUE INDEX anchor ON searchIndex (name, type, path);'))
          .then(() => db.prepare('INSERT OR IGNORE INTO searchIndex(name, type, path) VALUES (?, ?, ?);'))
          .then((stmt) => {
            return Promise.all(this.definitions.map(d => {
              return stmt.run(d.name, 'Entry', indexPath + '#' + d.id);
            }))
              .then(() => stmt);
          })
          .then((stmt) => stmt.finalize())
          .then(() => db.close())
          .catch(e => console.error(e))
    });
};



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
    mindmap: mindmap,
    /** Generate docset for Dash/Zeal
        @method */
    docset: docset,
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
