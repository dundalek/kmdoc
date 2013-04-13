
KMDoc.module({
    name: 'search',
    options: {
        template: _.template('<div class="input-append"><input id="searchbox" type="text" placeholder="type to search..."><span class="add-on"><i class="icon-search"></i></span></div>'),
        truncate: 30
    },
    init: function(options) {
      var values = _.values(KMDoc.definitions).map(function(x) {
        return {name: latinize(x.name), id: x.id};
      });

      KMDoc.controlBar
        .append(options.template())
        .find('#searchbox')
        .autocomplete({
          minLength: 0,
          focus: function( event, ui ) {
            $( "#searchbox" ).val( ui.item.name );
            return false;
          },
          select: function( event, ui ) {
            $( "#searchbox" ).val( '' );
            window.location.hash = '#'+ui.item.id;
            return false;
          },
          source: function( request, response ) {
            var term = latinize(request.term);
            // filter matching entries
            var matcher = new RegExp( $.ui.autocomplete.escapeRegex( term ), "i" );
            var ret = $.grep( values, function( value ) {
              //value = value.label || value.value || value;
              //return matcher.test( value ) || matcher.test( normalize( value ) );
              return matcher.test( value.name );
            });

            // items that match beginning are sorted first
            var sorter = new RegExp( '^' + $.ui.autocomplete.escapeRegex( term ), "i" );
            ret.sort(function(a,b) {
              return +sorter.test(b.name) - +sorter.test(a.name);
            });

            ret = ret.map(function(x) {return KMDoc.definitions[x.id]});

            response( ret );
          },open: function(){
            // set higher z-index, so dialogs won't cover autocomplete dropdown
            $(this).autocomplete('widget').css('z-index', 5000);
          }
        })
        .data( "ui-autocomplete" )._renderItem = function( ul, item ) {
          // show preview of definition, truncate characters
          var str = item.definition.substr(0, options.truncate);
          if (str.length === options.truncate) {
            str += '…';
          }
          return $( "<li>" )
            .append( "<a><b>" + item.name + "</b><br>" + str + "</a>" )
            .appendTo( ul );
        };
    }
});