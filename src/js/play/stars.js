'use strict';

var PlayStars = (function() {
  function PlayStars(options) {
    var defaults = {};
    options = $.extend({}, defaults, options);
    Stars.call(this, options);
  }

  // inherit from Stars
  PlayStars.prototype = Object.create(Stars.prototype);
  PlayStars.prototype.constructor = PlayStars;

  PlayStars.prototype.onPanEnd = function(){};

  PlayStars.prototype.render = function(percent){
    // go!
  };

  return PlayStars;

})();
