(function() {

    KMDoc.module({
        name: 'mindmap',
        options: {
            autoOpen: true,
            autoResize: false,
            markmapOptions: {
                autoFit: true,
                preset: 'colorful'
            },
            margin: 50
        },
        init: function(options) {
            $.getJSON(options.mindmapUrl, function(data) {
                
                function updateDialog() {
                    dialog.dialog({
                        width: $(window).width() - 2 * options.margin,
                        height: $(window).height() - 2 * options.margin
                    });
                    dialog.dialog('widget')
                        .css({ position: 'fixed' })
                        .position({ my: 'center', at: 'center', of: window });
                }
                
                var dialog = $('<div class="mindmap" title="Mind Map"><svg style="height: 100%; width: 100%"></svg></div>');
                dialog
                    .appendTo(document.body)
                    .dialog({
                        closeOnEscape: true,
                        autoOpen: true,
                        resizable: !options.autoResize,
                        modal: false,
                        width: $(window).width() - 2 * options.margin,
                        height: $(window).height() - 2 * options.margin,
                        create: updateDialog,
                        open: function (event, ui) {
                            if (options.autoResize) {
                                updateDialog();
                            }
                        },
                        resizeStop: function (event, ui) {
                            $(event.target).dialog('widget')
                                .css({
                                    position: 'fixed',
                                    left: ui.position.left - $(window).scrollLeft(),
                                    top: ui.position.top - $(window).scrollTop()
                                });
                        },
                        beforeClose: function(event, ui) {
                            dialog.dialog('widget').toggle();
                            event.preventDefault();
                        }
                    });

                KMDoc.modules.mindmap.initMindmap(".mindmap svg", data);

                if (!options.autoOpen) {
                    dialog.dialog('widget').hide();
                }

                if (options.autoResize) {
                    $(window).resize(_.debounce(updateDialog, 250));
                }
                    
                $('body').on('dblclick', '.definition-dialog .ui-dialog-title a', function(ev) {
                    dialog.dialog('close');
                });
                
                // add button to control bar for showing mindmap
                KMDoc.controlBar
                    .append('<button class="show-mindmap btn" title="Show mindmap"><i class=" icon-map-marker"></i></button>')
                    .on('click', '.show-mindmap.btn', function(ev) {
                        dialog.dialog('widget').toggle();
                    });
            });
        },
        initMindmap: function(el, data) {
            var mindmap = markmap(el, data, this.options.markmapOptions);
            
            var nodes = mindmap.svg.selectAll('.markmap-node');
            var toggleHandler = nodes.on('click');
            nodes.on('click', null);
            nodes.selectAll('.markmap-node-circle').on('click', toggleHandler);
            
            var selector = '.markmap-node-text';
            KMDoc.modules.tooltip.initDefinitionDialogTrigger(selector);
            $('body').off('click', selector).off('mouseenter', selector);
            
            nodes.selectAll(selector)
                .on('mouseenter', function(d) {
                    if (d.isDefinition) {
                        KMDoc.modules.tooltip.openDefinitionDialog(d.textId, d3.event.currentTarget, false);
                    }
                })
                .on('dblclick', function(d) {
                    location.hash = d.textId;
                    dialog.dialog('close');
                    d3.event.stopPropagation();
                })
                .on('click', function(d) {
                    if (d.isDefinition) {
                        KMDoc.modules.tooltip.openDefinitionDialog(d.textId, d3.event.currentTarget, true);
                        d3.event.preventDefault();
                    } else {
                        location.hash = d.textId;
                    }
                });
        }
    });
})();
