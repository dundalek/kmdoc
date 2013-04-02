
KMDoc.module({
    name: 'columns',
    options: {
        template: _.template('<div class="sections-controls input-append input-prepend"><span class="add-on btn minus" title="Show less columns">-</span><input disabled type="text"><span class="add-on btn plus" title="Show more columns">+</span></div>'),
        columns: 3
    },
    init: function(options) {
        var columns = options.columns;

        function update() {
            $('.sections-controls input').val(columns);
            var w = $('body').width()/columns;
            $('.section').css('max-width', w);
            $('body').masonry();
        }

        $('body').masonry({
            itemSelector: '.section',
            // set columnWidth a fraction of the container width
            columnWidth: function( containerWidth ) {
                return containerWidth / columns;
            }
        });

        KMDoc.controlBar
            .append(options.template())
            .on('click', '.sections-controls .minus', function(ev) {
                columns = Math.max(columns-1, 1); 
                update();
            })
            .on('click', '.sections-controls .plus', function(ev) {
                columns += 1;
                update();
            })

         update();

    }
});