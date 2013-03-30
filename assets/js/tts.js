
KMDoc.module({
    name: 'tts',
    options: {
        template: _.template('<span title="Play audio of pronounciation" data-tts="<%-name%>" class="snd favicon"></span>'),
        lang: 'en-US'
    },
    playSound: function(src) {
        console.log(src);
        if (typeof Audio !== 'undefined') {
            var snd = new Audio(src); // buffers automatically when created
            // snd.addEventListener('ended', function() {});
            snd.play();
        } else {
            $('.snd-embed').remove();
            $('body').append("<embed src=\""+src+"\" hidden=\"true\" autostart=\"true\" loop=\"false\" class=\"snd-embed\"/>");
        }
    },
    init: function(options) {
        $('body').on('click', '.snd', function(ev) {
            var t = $(ev.target).data('tts');
            t = 'http://translate.google.com/translate_tts?ie=UTF-8&q='+t+'&tl='+options.lang;
            KMDoc.modules.tts.playSound(t);
        });

        KMDoc.modules.tooltip.options.actions.unshift(options.template);
    }
});

