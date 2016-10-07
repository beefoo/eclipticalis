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

  PlayMusic.prototype.loadListeners = function(){};

  PlayMusic.prototype.playStar = function(star){
    var notesCount = this.notesCount;
    var minVolume = this.opt.minVolume;
    var maxVolume = this.opt.maxVolume;
    
    var mag = star.m;
    var y = Math.min(star.y, 0.99);
    var note = Math.floor(y * notesCount);
    var volume = UTIL.lerp(minVolume, maxVolume, mag);

    this.playNote(note, volume);
  };

  return PlayMusic;

})();
