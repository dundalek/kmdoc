
(function() {
    var linkFactoryTmpl = _.template('<a href="<%-link%>" title="<%-title%>" target="_blank"><img class="favicon" src="<%-favicon%>"></a>');

    function linkFactory(title, link) {
        return function(def) {
            return linkFactoryTmpl({
                link: _.template(link, def),
                title: title,
                favicon: (link.match(/^.*\/\/[^\/]+/)[0])+'/favicon.ico'
            });
        };
    }

    var supportedFiles = ["JPEG", "PNG", "GIF", "TIFF", "BMP", "MPEG4", "3GPP", "MOV", "AVI", "MPEGPS", "WMV", "FLV", "ogg", "DOC", "DOCX", "XLS", "XLSX", "PPT", "PPTX", "PDF", "TIFF", "SVG", "EPS", "PS", "TTF", "XPS"],
        file_r = new RegExp('('+supportedFiles.join('|')+')(#[0-9]+)?$','i'),
        sourceTmpl = _.template('<a href="<%=source%>" title="Link to source" target="_blank" class="source"></a>');

    function sourceLink(def) {
        if (!def.source) {
            return '';
        }

        var source = def.source,
            m,
            filetype,
            page;

        if (m = source.match(file_r)) {
            filetype = m[1].slice(1).toLowerCase();
            if (!source.match(/^https?:\/\//)) {
                // relative link, make it absolute from current location
                source = window.location.href.replace(/\/[^\/]+$/)+'/'+source;
            }

            // embedded=true for embedded view - make it configurable?
            source = 'http://docs.google.com/viewer?url='+encodeURIComponent(source.replace(m[2], ''));

            if (m[2]) {
                page = parseInt(m[2].slice(1), 10);
                // when embedded-true, the id is like :0.page.5 instead of :t.page.5
                page = '#:t.page.'+(page-1);
                source += page;
            }
        }

        return sourceTmpl({
            source: source
        });
    }

    KMDoc.module({
        name: 'tooltip',
        options: {
            template: _.template('<div class="input-append"><input id="searchbox" type="text"><span class="add-on"><i class="icon-search"></i></span></div>'),
            actions: [
                sourceLink,
                linkFactory('See on Wikipedia', 'http://en.wikipedia.org/w/index.php?search=<%=name%>'),
                linkFactory('Search on Google', 'http://www.google.com/search?query=<%=name%>'),
                linkFactory('See on WolframAlpha', 'http://www.wolframalpha.com/input/?i=<%=name%>')
            ],
            small: true,
            big: true
        },
        linkFactory: linkFactory,
        init: function(options) {
            if (options.small) {
                this.initActionDialog(options);
            }
            if (options.big) {
                this.initDefinitionDialog(options);
            }
        },
        initActionDialog: function(options) {
            var actionDialog = $('<div style="display:inline-block"></div>').dialog({
                resizable: false,
                autoOpen: false,
                draggable: false,
                width: 'auto',
                height: 'auto',
                minHeight: 10,
                dialogClass: 'action-dialog'
            });
            actionDialog.data('dialog').uiDialog.find('.ui-dialog-titlebar').remove();

            // TODO: _.debouce(fn, 250)

            $('body')
                .on('mouseenter', '.definition dt', function(ev) {
                    var id = $(ev.currentTarget).parent().attr('id'),
                        d = KMDoc.definitions[id];

                    var dia = actionDialog.data('dialog');
                    dia.element.html('<span class="actions">'+options.actions.map(function(x) {return x(d)}).join('')+'</span>');

                    actionDialog
                        .dialog( "option", "position", { my: "center bottom+2", at: "center top", of: $(ev.currentTarget) } )
                        .dialog( "open" );

                })
                .on('mouseleave', '.definition dt', function(ev) {
                    if (!$(ev.toElement).is('.ui-dialog')) {
                        actionDialog.dialog( "close" );
                    }
                })
                .on('mouseleave', '.action-dialog', function(ev) {
                    actionDialog.dialog( "close" );
                });
        },
        initDefinitionDialog: function(options) {
            function defDialog(ev, sticky) {
                var id = $(ev.currentTarget).attr('href').substr(1),
                    d = KMDoc.definitions[id];

                var dia = $('<div style="display:inline-block"></div>').dialog({
                    autoOpen: false,
                    width: '400',
                    height: 'auto',
                    minHeight: 10,
                    dialogClass: 'definition-dialog popover',
                    dragStart: function(event, ui) {
                        var dia = $(this);
                        if (dia.data('autolink-parent')) {
                            dia.data('autolink-parent').data('autolink-dialog', null);
                            dia.data('autolink-parent', null)
                        }
                    },
                    close: function( event, ui ) {
                        $(this).dialog('destroy').remove();
                    }

                });

                dia
                    .html($('#'+id+' dd').html())
                    .dialog( "option", "title", '<a href="#'+id+'">'+d.name+'</a><span class="actions">'+options.actions.map(function(x) {return x(d)}).join('')+'<span class="sticky-btn" title="Make this popover sticky"><i class="icon-magnet favicon"></i></span></span>')
                    .dialog( "option", "position", { my: "center bottom+2", at: "center top", of: $(ev.currentTarget) } )
                    .dialog( "open" );

                if (!sticky) {
                    dia.data('autolink-parent', $(ev.currentTarget));
                    $(ev.currentTarget).data('autolink-dialog', dia);
                }
            }

            // definitionDialog
            $('body')
                .on('mouseenter', '.autolink', function(ev) {
                    defDialog(ev, false);
                })
                .on('click', '.autolink', function(ev) {
                    defDialog(ev, true);
                    ev.preventDefault();
                })
                .on('mouseleave', '.definition-dialog', function(ev) {
                    var dia = $('.ui-dialog-content', ev.currentTarget);
                    if (dia.data('autolink-parent')) {
                        dia.data('autolink-parent').data('autolink-dialog', null);
                        dia.dialog('destroy').remove();
                    }

                })
                .on('click', '.definition-dialog', function(ev) {
                    var dia = $('.ui-dialog-content', ev.currentTarget);
                    if (dia.data('autolink-parent')) {
                        dia.data('autolink-parent').data('autolink-dialog', null);
                        dia.data('autolink-parent', null)
                    }
                })
                .on('mouseleave', '.autolink', function(ev) {
                    var dia = $(ev.currentTarget).data('autolink-dialog');
                    if (dia) {
                        if (!$(dia.data('dialog').uiDialog).is(ev.toElement) && !$(dia.data('dialog').uiDialog).has(ev.toElement).length) {
                            $(ev.currentTarget).data('autolink-dialog', null);
                            dia.dialog('destroy').remove();
                        }
                    }
                })
                .on('click', '.definition-dialog .sticky-btn', function(ev) {
                    var dia = $(this).parents('.definition-dialog'),
                        offset = dia.offset();
                    dia.css({position: 'fixed', top: offset.top - $(window).scrollTop(), left: offset.left - $(window).scrollLeft()});
                });

            // add button to control bar for closing all dialogs
            KMDoc.controlBar
                .append('<button class="dialog-control btn" title="Close all definition popovers"><i class="icon-remove-circle"></i></button>')
                .on('click', '.dialog-control.btn', function(ev) {
                    $(".definition-dialog .ui-dialog-content").dialog("destroy").remove();
                });
        }
    });
})();