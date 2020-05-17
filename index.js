
var fs = require('fs'),
    path = require('path'),
    _  = require('underscore'),
    YAML = require('yamljs'),
    modules = require('./modules'),
    helpers = require('./helpers');

/** @class KMDocInst */
function KMDocInst(options) {
    this.options = _.extend({}, this.options, options);
    this._head = [];
    this._preprocess = [];
    this._postprocess = [];

    this.addStyle(this.options.componentsPath+'bootstrap/css/bootstrap.css');
    this.addStyle(this.options.componentsPath+'kmdoc/assets/css/style.css');
    //this.addStyle(this.options.componentsPath+'jquery-ui/themes/cupertino/jquery-ui.css');
    this.addStyle(this.options.componentsPath+'kmdoc/assets/jquery-bootstrap/jquery-ui-1.9.2.custom.css');

    this.addScript(this.options.componentsPath+'jquery/jquery.min.js');
    this.addScript(this.options.componentsPath+'jquery-ui/ui/jquery-ui.js');
    this.addScript(this.options.componentsPath+'underscore/underscore.js');
    this.addScript(this.options.componentsPath+'kmdoc/assets/js/main.js');
}

_.extend(KMDocInst.prototype,
/** @lends KMDocInst# */
{
    modules: modules,
    helpers: helpers,
    options: {
        fileIn: '',
        fileOut: '',
        basename: '',
        title: '',
        lang: 'en',
        encoding: 'utf-8',
        baseUrl: '',
        componentsPath: 'components/',
        defTmpl: _.template('\n<div class="definition" id="<%- id %>"><dt><%- name %><%- typeof alias === "string" ? " ("+alias+")": "" %></dt><dd><%= definition %></dd></div>\n'),
        fileTmpl: _.template('<!DOCTYPE html>\n<html lang="<%- options.lang %>">\n<head>\n <meta charset="<%- options.encoding %>"/>\n <title><%- options.title %></title><%= head %>\n</head>\n<body>\n\n<div class="navbar navbar-inverse navbar-fixed-top"><div class="navbar-inner"><a class="brand" href="#"><%- options.title %></a><div class="control-toolbar"></div></div></div>\n\n<%= content %>\n\n</body>\n</html>\n'),
        defaultHelpers: ['trim']
    },
    /** Run building process */
    build: function() {
        // ensure filenames
        if (!this.options.fileIn) {
            this.options.fileIn = this._detectFilename();
        }
        if (!this.options.basename) {
            this.options.basename = this.options.fileIn.replace(/\.md$/, '');
        }
        if (!this.options.fileOut) {
            this.options.fileOut = this.options.basename + '.html';
        }

        this.load();
        this._applyFns(this._preprocess);

        // dictionary for unique indexes
        this.defsIdx = {};

        // parse definitions
        var tmp = this.parse(this.input);
        this.input = tmp.str;
        this.definitions = tmp.definitions;

        // include and save extracted definitions
        fs.writeFileSync(this.options.basename + '-definitions.json', JSON.stringify(this.defsIdx));

        this.addHead('<script>KMDoc.definitionsUrl = "' + (this.options.basename.match(/[^\/]+$/)[0]) + '-definitions.json";</script>');

        // convert with markdown
        this.output = this.options.fileTmpl({
            options: this.options,
            head: this._buildAssets(),
            content: this._applyHelpers(this.input, ['md'])
        });

        this._applyFns(this._postprocess);
        this.save();
    },
    /** Load file into memory */
    load: function() {
        this.input = fs.readFileSync(this.options.fileIn, this.options.encoding);
    },
    /** Save file */
    save: function() {
        fs.writeFileSync(this.options.fileOut, this.output);
    },
    /** Parse and extract definitions from input string
        @param {string} str */
    parse: function(str) {
        var lines = str.split('\n'),
            out = [],
            headers = [],
            defs = [];

        for (var i = 0; i < lines.length; i+=1) {
            var line = lines[i];

            if (line.match(/^#/)) {
                // line contains header, parse it and store it in the hierarchy
                var n = line.match(/^#+/)[0].length-1;
                var h = line.replace(/^\s+|\s+$/g, '').replace(/^#+/, '').trim();
                headers = headers.slice(0, n+1);
                headers[n] = h;
                headers = headers.filter(function(x) {return x});
                out.push(line);

            } else if (line.match(/^\s*:/)) {
                // line contains definition
                var def = {
                    name: out.pop(),
                    headers: headers,
                    definition: ''
                };
                var buf = [line.replace(/^\s*:\s*/, 'definition: ')];
                i += 1;
                // load all lines until blank line to buffer
                while (i < lines.length) {
                    line = lines[i];
                    if (line === '') {
                        break;
                    } else {
                        buf.push(line);
                    }
                    i += 1;
                }
                // parse the properties with YAML
                try {
                    _.extend(def, YAML.parse(buf.join('\n')));
                } catch (e) {
                    console.log('YAML error:', e, '\nin text:\n' + buf.join('\n'));
                }
                // handle and store definition
                def = this.transformDef(def);
                this._addToIndex(def);
                defs.push(def);
                // render definition to output
                out.push(this.options.defTmpl(def));

            } else {
                // ordinary line, copy to output
                out.push(line);
            }

        }

        return {
            str: out.join('\n'),
            definitions: defs
        };
    },
    /** Transform definition object
        This function is applied to every definition after parsing. By default it applies attribute helpers and generates unique id.
        @param {object} def - definition*/
    transformDef: function(def) {
        // apply helpers
        for (var k in def) {
            if (typeof def[k] !== 'string') {
                continue;
            }
            var helpers = this._parseHelpers(k);
            if (helpers.length > 1) {
                def[helpers[0]] = this._applyHelpers(def[k], helpers.slice(1));
                delete def[k];
            } else if (this.options.defaultHelpers && this.options.defaultHelpers.length) {
                def[k] = this._applyHelpers(def[k], this.options.defaultHelpers);
            }
        }

        return def;
    },
    /** Use specified modules
        Parameters can be either functions or strings */
    use: function() {
        var self = this;
        _.each(arguments, function(mod) {
            if (typeof mod === 'function') {
                // function apply directly
                mod.call(self);
            } else {
                if (typeof mod === 'string') {
                    var tmp = {};
                    tmp[mod] = {};
                    mod = tmp;
                }
                // support for options
                _.each(mod, function(opts, m) {
                    if (m in self.modules) {
                        self.modules[m].call(self, opts);
                    }
                });
            }
        });
        return this;
    },
    /** Register preprocessing function
        @param {function} fn */
    preprocess: function(fn) {
        this._preprocess.push(fn);
        return this;
    },
    /** Register postprocessing function
        @param {function} fn  */
    postprocess: function(fn) {
        this._postprocess.push(fn);
        return this;
    },
    /** Add stylesheet file into document
        @param {string} filename */
    addStyle: function(filename) {
        this._head.push({type: 'style', value: filename});
        return this;
    },
    /** Add script file into document
        @param {string} filename */
    addScript: function(filename) {
        this._head.push({type: 'script', value: filename});
        return this;
    },
    /** Add html code into head of document
        @param {string} html */
    addHead: function(html) {
        this._head.push({type: 'raw', value: html});
        return this;
    },

    /** Generates code of included assets
        @returns {string}
        @private */
    _buildAssets: function() {
        var self = this;
        return this._head.map(function(x) {
            switch (x.type) {
                case 'style':
                    return '<link rel="stylesheet" href="'+self._url(x.value)+'"/>';
                case 'script':
                    return '<script src="'+self._url(x.value)+'"></script>';
            }
            return x.value;
        }).join('');
    },
    /** Automatic filename detection
        @returns {string}
        @private */
    _detectFilename: function() {
        var f;
        // first check commnd line arguments
        if (process.argv.length > 2 ) {
            f = process.argv[2];
            if (fs.existsSync(f) && fs.statSync(f).isFile()) {
                return f;
            }
        }
        // then look for markdown files in current directory
        var files = fs.readdirSync(process.cwd());
        files.sort();
        for (var i = 0; i < files.length; i+=1) {
            f = files[i];
            if (f.match(/\.md$|\.markdown$/)) {
                return f;
            }
        }
    },
    /** Adds baseUrl for non-absolute urls
        @param {string} url
        @returns {string}
        @private */
    _url: function(url) {
        return url.match(/^https?:\/\//) ? url : this.options.baseUrl + url;
    },
    /** Apply list of functions
        @param {array} fns
        @private */
    _applyFns: function(fns) {
        var self = this;
        fns.forEach(function(f) {
            f.call(self);
        });
    },
    /** Apply list of helpers to string
        @param {string} str
        @param {array} helpers
        @returns {string}
        @private */
    _applyHelpers: function(str, helpers) {
        var self = this;
        helpers.forEach(function(h) {
            if (h in self.helpers) {
                str = self.helpers[h](str);
            }
        });
        return str;
    },
    /** Parse attribute for occurence of helpers
        @param {string} str
        @returns {array}
        @private */
    _parseHelpers: function(str) {
        return str.split('|');
    },
    /** Create unique ID and add to index */
    _addToIndex: function(def) {
        // generate unique id
        var id = this.helpers.normalizeTag(def.name);
        if (id in this.defsIdx) {
            for (var j = 2; true; j+=1) {
                if (!(id+'-'+j in this.defsIdx)) {
                    id = id+'-'+j;
                    break;
                }
            }
        }
        def.id = id;
        this.defsIdx[id] = def;
    }
});

/** @module KMDoc */

module.exports = {
    /** Factory method to create instance */
    create: function(options) {
        return new KMDocInst(options);
    },
    template: _.template
};
