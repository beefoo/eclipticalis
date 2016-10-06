'use strict';

// Extends Music
var Harmony = (function() {
  function Harmony(options) {
    var defaults = {
      notes: [
        {note: 'a', octave: 5, src: 'audio/flute/ae1_19_a4-x2.mp3'},
        {note: 'bb', octave: 5, src: 'audio/flute/ae1_06_bb5-x2.mp3'},
        {note: 'c', octave: 5, src: 'audio/flute/ae1_27_c5-x8.mp3'},
        {note: 'd', octave: 5, src: 'audio/flute/ae1_20_d5-x8.mp3'},
        {note: 'eb', octave: 5, src: 'audio/flute/ae1_22_eb5-x7.mp3'},
        {note: 'f', octave: 5, src: 'audio/flute/ae1_11_f5-x6.mp3'},
        {note: 'g', octave: 5, src: 'audio/flute/ae1_02_g5-x2.mp3'}
      ]
    };
    options = $.extend({}, defaults, options);
    Music.call(this, options);
  }

  // inherit from Music
  Harmony.prototype = Object.create(Music.prototype);
  Harmony.prototype.constructor = Harmony;

  Harmony.prototype.init = function(){
    this.notes = [];
    this.activeNotes = [];
    this.isMuted = false;
    this.loadNotes();
    this.loadListeners();
  };

  Harmony.prototype.onLoadNote = function(i){
    this.notesLoaded++;
    if (this.notesLoaded >= this.notesCount) {
      console.log(this.notesLoaded + ' harmony notes loaded.');
      $.publish('harmony.loaded', 'Harmony loaded.');
    }
  };

  Harmony.prototype.onStarsAligned = function(points){

  };

  Harmony.prototype.render = function(progress){

  };

  return Harmony;

})();
