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
    if (percent < 0.5) percent = UTIL.norm(percent, 0, 0.5);
    else percent = 1.0 - UTIL.norm(percent, 0.5, 1);

    var note = Math.floor(percent * this.notesCount);

    if (this.activeNote !== note) {
      this.stopNote(this.activeNote);
      this.activeNote = note;
      this.playNote(this.activeNote, 1.0, true);
    }
  };

  return PlayHarmony;

})();
