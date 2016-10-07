'use strict';

//=include vendor/jquery-3.1.0.min.js
//=include vendor/ba-tiny-pubsub.min.js
//=include vendor/three.min.js
//=include vendor/howler.core.min.js
//=include helpers.js
//=include config.js
//=include music.js
//=include harmony.js
//=include stars.js
//=include play/music.js
//=include play/harmony.js
//=include play/stars.js

var PlayApp = (function() {
  function PlayApp(options) {
    var defaults = {
      container: '#main',
      totalMs: 240000, // 4 mins
      recordMode: true
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  PlayApp.prototype.init = function(){
    var _this = this;

    this.recordMode = this.opt.recordMode;
    this.seqStart = 0;

    // wait for stars and music to be loaded
    this.queueSubscriptions(['stars.loaded', 'music.loaded', 'harmony.loaded']);

    // load stars and music
    this.music = new PlayMusic($.extend(this.opt.harmony, {recordMode: this.recordMode}));
    this.harmony = new PlayHarmony($.extend(this.opt.harmony, {recordMode: this.recordMode}));
    this.stars = new PlayStars($.extend(this.opt.harmony, {recordMode: this.recordMode}));
  };

  PlayApp.prototype.loadListeners = function(){
    var _this = this;

    // resize
    $(window).on('resize', function(){ _this.onResize(); });
  };

  PlayApp.prototype.onResize = function(){
    this.stars.onResize();
  };

  PlayApp.prototype.onReady = function(){
    $('.loading').hide();
    $('.instructions').show().addClass('active');
    var d = new Date();
    this.startMs = d.getTime();
    this.loadListeners();
    this.render();
  };

  PlayApp.prototype.queueSubscriptions = function(subs){
    var _this = this;
    var total = subs.length;
    var loaded = 0;

    $.each(subs, function(i, s){
      $.subscribe(s, function(e, data){
        console.log(data.message);
        loaded++;
        if (loaded >= total) _this.onReady();
      });
    });
  };

  PlayApp.prototype.render = function(){
    var _this = this;
    var t = new Date();
    var elapsedMs = t.getTime() - this.startMs;
    var percent = elapsedMs / this.opt.totalMs;
    percent = UTIL.lim(percent, 0, 1);

    this.stars.render(percent);
    // this.music.render(percent);
    if (!this.recordMode) this.harmony.render(percent);

    // restart loop
    if (percent >= 1) {
      this.startMs = t.getTime();
    }

    // continue if time left
    if (!this.recordMode || percent < 1) {
      requestAnimationFrame(function(){
        _this.render();
      });
    } else {
      console.log('Finished.')
      this.stars.downloadSequence();
    }
  };

  return PlayApp;

})();

$(function() {
  var app = new PlayApp(CONFIG);
});
