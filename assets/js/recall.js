
KMDoc.module({
    name: 'recall',
    options: {
        template: _.template('<div class="learn-controls btn-group"><button class="btn active" title="Show everything">both</button><button class="btn" title="Show only terms without definitions">terms</button><button class="btn" title="Show only definitions without terms">definitions</button></div>')
    },
    init: function(options) {

        KMDoc.controlBar
            .append(options.template())
            .on('click', '.learn-controls .btn', function(ev) {
                var el = $(ev.currentTarget);
                el.parent().children().removeClass('active');
                el.addClass('active');
                switch(el.text()) {
                    case 'both': $('.definition dt').removeClass('invisible'); $('.definition dd').removeClass('invisible'); break;
                    case 'terms': $('.definition dt').removeClass('invisible'); $('.definition dd').addClass('invisible'); break;
                    case 'definitions': $('.definition dt').addClass('invisible'); $('.definition dd').removeClass('invisible'); break;
                }
            });

    }
});