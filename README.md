# KMDoc

KMDoc is a software for an intelligent representation of knowledge. It can be used for effective learning or quick browsing and retrieval of useful knowledge. It can be used to represent knowledge of basically any science field. Is is also useful for languages and vocabularies. See essay about [learning](http://knomaton.org/learning.html) that describes underlying thoughts.

Knowledge is first written down in plain text and then automatic tool extracts definitions of concepts and creates rich HTML page for viewing in browser, exports flashcards and so on.

See examples:

- [Graph Theory glossary](http://kb.knomaton.org/graph-theory/graph-theory.html) - This example among other features shows useful navigation in nested definitions.
- [Chinese notes](http://kb.knomaton.org/chinese/out/chinese.html) - Notes from chinese class. Vocabulary can be automatically pronounced using text-to-speech Google API.

## Format

The format is based on markdown. Using plain text has advantage that no extra software is needed and knowledge can be easily written in form of notes during a lecture.

Here is an example:

```
# Heading 1
## Heading 2

*emphasize*

concept a
: here is definition

concept b .. alternative notation (when using shortdef module)

Force
: any influence that causes an object to undergo a certain change, either concerning its movement, direction, or geometrical construction.
symbol: F
formal: F = m * a
```

## Metadata

You can specify metadata in [YAML](http://en.wikipedia.org/wiki/YAML) format.

These are common fields of definition. Not all of these fields are yet used, but consider it a informal ontology for future applications.

- name
- definition, def - informal definition, this is default
- formal - formal definition
- symbol
- alias
- introduction
- note / notes
- example, eg / examples
- exercise, ex / exercises
- tags
- source - URL to source of definition
- reference / references - links to other useful material
- type - note, definition, vocabulary

### Metadata usage

Here is a list of metadata, which are currently used and have functional meaning:

- **name** - name of the definition and title of the popup
- **definition** - definition and contents of the popup
- **symbol**, **alias** - used for autolinking
- **source** - used to link to source. You can link web pages, PDF, doc and other formats supported by [Google docs viewer](http://docs.google.com/viewer). You can add page number with hash sign to open document at specified page. For example source link lecture.pdf#5 will open the document on page 5. Check out the [shortsource](https://github.com/dundalek/kmdoc/blob/master/doc/modules.md#shortsource) module how to specify sources more easily.


### Helpers

You can specify helpers to transform property (it is inspired by [Variable Modifiers](http://www.smarty.net/docs/en/language.modifiers.tpl) for Smarty templates).
```
B element
: This element shows bold text
example|html: <b>not bold</b>
```

Currently supported helpers are:

- markdown (alias md) - Compile markdown markup
- html - Escape html
- upper - Covert string to upper-case
- lower - Covert string to lower-case

See [how to add new helper](https://github.com/dundalek/kmdoc/blob/master/doc/cookbook.md#add-helper).

## Usage

To compile the knowledge file, create build file (usually named *build.js*). Here is the basic sample. First the instance is created (you can pass options object), then follows *use* method to specify which modules are to be used and finally the *build* method.

```javascript
var kmd = require('./components/kmdoc').create();

kmd.use(
'shortdef', 'shortsource', 'toc', 'columns', 'tooltip', 'math', 'recall', 'autolink', 'search', 'flashcard');

kmd.build();
```

### API

Methods

- build()
- use(module*) - use module(s)
	Options can be specified with object like this:
	<code>kmd.use({flashcard: {out: 'outfile.csv'}});</code>
- preprocess(fn) - add function to be called before transformation
- postprocess(fn) - add function to be called after transformation
- addStyle(filename) - add stylesheet to document
- addScript(filename) - add script file to document
- addHead(html) - add html code to &lt;head&gt; element

Properties

- fileIn - filename of an input file, default autodetect from commandline or in currenn working directory
- fileOut - filename of an input file, default same basename as fileIn plus html extension
- options
	- encoding - input encoding, default utf-8
	- baseUrl - prepends baseUrl for relative urls of scripts and links
	- defTmpl - template used to render definition. It is a function with one parameter, returns string.
	- defaultHelpers - array of helpers to be applied on every definition, default empty
		example: ['upper', 'md']

See [API doc](http://kb.knomaton.org/api/KMDocInst.html) for more information.

### Modules

Advanced functionality is added via modules for flexibility. See [Modules documentation](https://github.com/dundalek/kmdoc/blob/master/doc/modules.md) to find out which modules are available.

See the [cookbook](https://github.com/dundalek/kmdoc/blob/master/doc/cookbook.md#writing-modules) for how to create your own module.
