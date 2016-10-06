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

    this.noteAlpha = false;
    this.noteBeta = false;
    this.activeNoteAlpha = false;
    this.activeNoteBeta = false;

    this.loadNotes();
    this.loadListeners();
  };

  Harmony.prototype.onLoadNote = function(player){
    this.notesLoaded++;
    if (this.notesLoaded >= this.notesCount) {
      console.log(this.notesLoaded + ' harmony notes loaded.');
      $.publish('harmony.loaded', 'Harmony loaded.');
      // for (var i=0; i<this.notes.length; i++)
      //   this.notes[i].duration = this.notes[i].player.duration();
    }
  };

  Harmony.prototype.onStarsAligned = function(data){
    var position = data.position;
    var notesCount = this.notesCount;
    var alpha = UTIL.lim(position.alpha, 0, 1);
    var beta = UTIL.lim(position.beta, 0, 1);

    this.noteAlpha = Math.floor(alpha * notesCount);
    this.noteBeta = Math.floor(beta * notesCount);
  };

  Harmony.prototype.seek = function(i, seconds){
    if (i===false || i < 0 || i >= this.notes.length) return false;
    this.notes[i].player.seek(seconds);
  };

  Harmony.prototype.stopNote = function(i){
    if (i===false || i < 0 || i >= this.notes.length) return false;
    this.notes[i].player.loop(false);
  };

  Harmony.prototype.render = function(progress){
    if (this.activeNoteAlpha !== this.noteAlpha) {
      this.stopNote(this.activeNoteAlpha);
      this.activeNoteAlpha = this.noteAlpha;
      // console.log('Playing', this.activeNoteAlpha)
      // this.playNote(this.activeNoteAlpha, 1.0, true);
    }

    if (this.activeNoteBeta !== this.noteBeta) {
      this.stopNote(this.activeNoteBeta);
      this.activeNoteBeta = this.noteBeta;
      // start half way
      // var seconds = Math.round(this.notes[this.activeNoteBeta].duration / 2);
      // this.seek(this.activeNoteBeta, seconds);
      // console.log('Playing', this.activeNoteBeta, seconds)
      this.playNote(this.activeNoteBeta, 1.0, true);
    }
  };

  return Harmony;

})();
