'use strict';

var PlayHarmony = (function() {
  function PlayHarmony(options) {
    var defaults = {};
    options = $.extend({}, defaults, options);
    Harmony.call(this, options);
  }

  // inherit from Harmony
  PlayHarmony.prototype = Object.create(Harmony.prototype);
  PlayHarmony.prototype.constructor = PlayHarmony;

  PlayHarmony.prototype.loadListeners = function(){};

  PlayHarmony.prototype.render = function(percent){
    
  };

  return PlayHarmony;

})();
