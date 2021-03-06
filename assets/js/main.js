
window.KMDoc = window.KMDoc || {};

KMDoc.modules = {};
KMDoc._modules = [];
KMDoc.module = function(mod) {
	KMDoc._modules.push(mod);
	if (mod.name) {
		KMDoc.modules[mod.name] = mod;
	}
}

$(function() {

    KMDoc.controlBar = $('.control-toolbar');

    $.getJSON(KMDoc.definitionsUrl, function(data) {
    	KMDoc.definitions = data;
    	_.each(KMDoc._modules, function(mod) {
	    	if (mod.init && typeof mod.init === 'function') {
	    		mod.init.call(mod, mod.options);
	    	}
	    });	
    });
});