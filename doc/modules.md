
# Modules

### shortdef

Enable shorter way for definition with double dot. It is useful for language vocabularies.

Example:
```
term1 .. definition1
term2 .. definition2

```

### shortsource

Allows shorter way to specify source with at-notation.

Following examples are the same:
```
term @http://example.com/something.pdf
: definition


term
: definition
source: http://example.com/something.pdf
```

### flashcard

Save definitions to CSV file for use as flashcards. These can be imported to Anki and other learning software.

Options:
- out {string}: filename where the output shoud be saved

### toc

Enable dynamic table of contents.

Options:
- side: "left" or "right", default is "right"

### columns

Display the content in multiple columns, useful for printing handouts, because more information fit on the page.

### tts

Enable text-to-speech using Google speech API. It is useless without tooltip.

Options:
- lang: language, for example "en-US" for english, "zh-CN" for chinese
- transform: function to get string to be translated from definition object, b default it is the name attribte

### tooltip

Enables tooltips. There are two kinds of tooltips:
- small: it is action icons when hovered over definition
- big: definition details when hovered or clicked on definiton link

Both of them are active when this module is enabled. You can disable each type by following code:

```
kmd.addHead('<script>KMDoc.modules.tooltip.options.small = false;</script>');
kmd.addHead('<script>KMDoc.modules.tooltip.options.big = false;</script>');
```

### math

Support for math formulas. You can use TeX format or AsciiMathML.

```
inline:

    \\( {e}^{i\pi }+1=0 \\)

formula on a single line:

    \\[ {x}_{1,2}=\frac{-b\pm \sqrt{{b}^{2}-4ac}}{2a} \\]
```

### recall

Adds controls which allow to hide, term or definition text. Useful for learning and practising recall of knowledge.

### autolink

Automatically links occurences for interconnected terms.

### search

Adds search functionality.
