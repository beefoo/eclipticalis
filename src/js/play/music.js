'use strict';

var PlayMusic = (function() {
  function PlayMusic(options) {
    var defaults = {};
    options = $.extend({}, defaults, options);
    Music.call(this, options);
  }

  // inherit from Music
  PlayMusic.prototype = Object.create(Music.prototype);
  PlayMusic.prototype.constructor = PlayMusic;

  PlayMusic.prototype.loadListeners = function(){
    var _this = this;

    $.subscribe('star.intersected', function(e, data){

    });
  };

  return PlayMusic;

})();
