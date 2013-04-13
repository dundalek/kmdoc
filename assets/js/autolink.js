
KMDoc.module({
    name: 'autolink',
    options: {
        template: _.template('<a class="autolink" href="#<%-id%>"><%=text%></a>'),
        stem: function(str) {
            return str.toLowerCase();
        },
        fillChars: '\\s,.;\\[\\]\\(\\)"\''
    },
    init: function(options) {
    	var r = new RegExp('[^'+options.fillChars+']+', 'g'),
			r_all = new RegExp('['+options.fillChars+']+|[^'+options.fillChars+']+', 'g');

		var autoElement = function(el) {
			var $this = $(el),
				str = $this.html(),
				strNew = autolink(str);
			if (strNew !== str) {
				$this.html(strNew);
			}
		}

		// match from input on ith position of input with tokens
		// return list matched tokens or false
		var checkMatch = function(input, i, tokens) {
			var j, k;
			for (j = 0, k = 0; j < tokens.length && i+k < input.length; j+=1, k+=1) {
				if (!input[i+k].tok) {
					k += 1;
					if (i+k >= input.length) {
						// not enough input to match
						return false;
					}
				}
				if (input[i+k].tok !== tokens[j].tok) {
					// tokens do not match
					return false;
				}
			}
			// if all tokens are matched, we return the matched section
			if (j === tokens.length) {
				return input.slice(i, i+k);
			}
			return false;
		}

		// divide input into tokens
		var tokenize = function(str) {
			return str.match(r).map(function(x) {
				return {
					text: x,
					tok: options.stem(x)
				};
			});
		}

		var autolink = function(txt) {
			var tokens = (txt.match(r_all)||[]).map(function(x) {
					return {text: x, tok: r.test(x) ? options.stem(x) : null};
				}),
				output = [];

			for (var i = 0; i < tokens.length; i+=1) {
				if (!tokens[i].tok || !(tokens[i].tok in idx)) {
					// if it is white space or the token is not in index, we just copy it to output
					output.push(tokens[i].text);
				} else {
					var arr = idx[tokens[i].tok];
					// check all candidates, longest first
					for (var j = 0; j < arr.length; j+=1) {
						var m;
						if (m = checkMatch(tokens, i, arr[j].tokens)) {
							// we have a match of all words
							output.push(options.template({
								id: arr[j].id,
								text: m.map(function(x) {return x.text}).join('')
							}));
							i += m.length-1;
							break;
						}
					}
				}

			}

			return output.join('');
		}

    	var idx = {};

    	// create index by the firt word of definition
		_.each(KMDoc.definitions, function(def) {
			var keys = [def.name];
			def.symbol && keys.push(def.symbol);
			def.symbols && (keys = keys.concat(def.symbols));
			def.alias && keys.push(def.alias);
			def.aliases && (keys = keys.concat(def.aliases));

			_.each(keys, function(key) {
                var obj = {
                	tokens: tokenize(key),
                	id: def.id
                };
                key = obj.tokens[0].tok;
				if (key in idx) {
					idx[key].push(obj);
				} else {
					idx[key] = [obj];
				}
			});

		});

		// sort to match the longest definitions first
		_.each(idx, function(arr) {
			arr.sort(function(a,b) {
				return b.tokens.length - a.tokens.length;
			});
		});

		// TODO: use workers or batching so we do not block main thread

		$('.definition dd').each(function() {
			autoElement(this);
		});

		$('.section>*:not(.definition,h1,h2,h3,h4,h5,h6)').each(function() {
			autoElement(this);
		});

    }
});