'use strict';

var Music = (function() {
  function Music(options) {
    var defaults = {
      notes: [
        // {note: 'bb', octave: 2, src: 'audio/grand_piano/Bb2.mp3'},
        {note: 'c', octave: 3, src: 'audio/grand_piano/C3.mp3'},
        {note: 'd', octave: 3, src: 'audio/grand_piano/D3.mp3'},
        {note: 'eb', octave: 3, src: 'audio/grand_piano/Eb3.mp3'},
        {note: 'f', octave: 3, src: 'audio/grand_piano/F3.mp3'},
        {note: 'g', octave: 3, src: 'audio/grand_piano/G3.mp3'},
        {note: 'a', octave: 3, src: 'audio/grand_piano/A3.mp3'},
        {note: 'bb', octave: 3, src: 'audio/grand_piano/Bb3.mp3'},
        {note: 'c', octave: 4, src: 'audio/grand_piano/C4.mp3'},
        {note: 'd', octave: 4, src: 'audio/grand_piano/D4.mp3'},
        {note: 'eb', octave: 4, src: 'audio/grand_piano/Eb4.mp3'},
        {note: 'f', octave: 4, src: 'audio/grand_piano/F4.mp3'},
        {note: 'g', octave: 4, src: 'audio/grand_piano/G4.mp3'},
        {note: 'a', octave: 4, src: 'audio/grand_piano/A4.mp3'}
        // {note: 'bb', octave: 4, src: 'audio/grand_piano/Bb4.mp3'}
      ]
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Music.prototype.init = function(){
    this.notes = [];
    this.activeNotes = [];
    this.queueReset = false;
    this.loadNotes();
    this.loadListeners();
  };

  Music.prototype.loadListeners = function(){
    var _this = this;

    $.subscribe('stars.aligned', function(e, data){
      _this.onStarsAligned(data.points);
    });
  };

  Music.prototype.loadNotes = function(t){
    var _this = this;
    var notes = this.opt.notes;
    this.notesCount = notes.length;
    this.notesLoaded = 0;

    for (var i=0; i<notes.length; i++) {
      var note = notes[i];
      note.player = new Howl({
        src: note.src,
        onload: function(){ _this.onLoadNote(i); }
      });
      this.notes.push(note);
    }
  };

  Music.prototype.onLoadNote = function(i){
    this.notesLoaded++;
    if (this.notesLoaded >= this.notesCount) {
      console.log(this.notesLoaded + ' notes loaded.');
      $.publish('music.loaded', true);
    }
  };

  Music.prototype.onPanStart = function(){
    this.activeNotes = [];
  };

  Music.prototype.onStarsAligned = function(points){
    var notesCount = this.notesCount;

    points = points.slice();
    points = points.map(function(point){
      point.played = false;
      var y = Math.min(point.y, 0.99);
      point.note = Math.floor(y * notesCount);
      return point;
    });
    this.activeNotes = points;
  };

  Music.prototype.playNote = function(i){
    this.notes[i].player.play();
  };

  Music.prototype.render = function(progress){
    if (progress < 0) return false;
    var activeNoteLen = this.activeNotes.length;

    if (progress < 0.49 && this.queueReset) {
      this.queueReset = false;
      this.resetActiveNotes();
    }

    for (var i=0; i<activeNoteLen; i++){
      var n = this.activeNotes[i];
      if (!n.played && progress > n.start && progress < n.end) {
        this.playNote(n.note);
        this.activeNotes[i].played = true;
        if (i >= (activeNoteLen-1)) {
          this.queueReset = true;
        }
      }
    }
  };

  Music.prototype.resetActiveNotes = function(){
    for (var i=0; i<this.activeNotes.length; i++){
      this.activeNotes[i].played = false;
    }
  };

  return Music;

})();
