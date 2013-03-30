
KMDoc.module({
    name: 'autolink',
    options: {
        template: _.template('<a class="autolink" href="#<%-id%>"><%=text%></a>')
    },
    init: function(options) {
    	// TODO: use workers or batching so we do not block main thread

    	var idx = {};

		_.each(KMDoc.definitions, function(def) {
			var key = (def.name.split(' ')[0]).toLowerCase();
			if (key in idx) {
				idx[key].push(def);
			} else {
				idx[key] = [def];
			}
		});

		_.each(idx, function(arr) {
			arr.sort(function(a,b) {
				return b.name.length - a.name.length;
			});
		});

		var autolink = function(txt) {
			return txt.replace(/[^ ]+/g, function(m) {
				var key = m.toLowerCase();
				if (key in idx) {
					var arr = idx[key];
					for (var i = 0; i < arr.length; i+=1) {
						// TODO: lookahead
						if (arr[i].name.toLowerCase() === key) {
							return options.template({
								id: arr[i].id,
								text: m
							});
						}
					}
				}
				return m;
			});
		}

		$('.definition dd').each(function() {
			var $this = $(this);
			var str = $this.html();
			var strNew = autolink(str);
			if (str !== strNew) {
				$this.html(strNew);
			}
		});

    }
});