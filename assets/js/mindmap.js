(function() {

    KMDoc.module({
        name: 'mindmap',
        options: {
            autoOpen: false,
            margin: 50
        },
        init: function(options) {
            $.getJSON(options.mindmapUrl, function(data) {
                
                function updateDialog() {
                    dialog.dialog({
                        width: $(window).width() - 2 * options.margin,
                        height: $(window).height() - 2 * options.margin
                    });
                    dialog.dialog("option", "position", dialog.dialog("option", "position"));
                }
                
                var dialog = $('<div class="mindmap" title="Mind Map"></div>');
                dialog
                    .appendTo(document.body)
                    .dialog({
                        closeOnEscape: true,
                        autoOpen: options.autoOpen,
                        modal: true,
                        width: $(window).width() - 2 * options.margin,
                        height: $(window).height() - 2 * options.margin,
                        open: updateDialog
                    });
                    
                $(window).resize(_.debounce(updateDialog, 250));
                    
                markmap(d3.select(".mindmap"), data);
                
                // add button to control bar for showing mindmap
                KMDoc.controlBar
                    .append('<button class="show-mindmap btn" title="Show mindmap"><i class=" icon-map-marker"></i></button>')
                    .on('click', '.show-mindmap.btn', function(ev) {
                        if (dialog.dialog('isOpen')) {
                            dialog.dialog('close');
                        } else {
                            dialog.dialog('open');
                        }
                    });
            });
        }
    });
})();