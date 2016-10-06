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
      barMs: 6000
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  PlayApp.prototype.init = function(){
    var _this = this;

    this.seqStart = 0;

    // wait for stars and music to be loaded
    this.queueSubscriptions(['stars.loaded', 'music.loaded', 'harmony.loaded']);

    // load stars and music
    this.music = new PlayMusic(this.opt.music);
    this.harmony = new PlayHarmony(this.opt.harmony);
    this.stars = new PlayStars(this.opt.stars);
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
    this.loadListeners();
    this.render();
  };

  PlayApp.prototype.queueSubscriptions = function(subs){
    var _this = this;
    var total = subs.length;
    var loaded = 0;

    $.each(subs, function(i, s){
      $.subscribe(s, function(e, message){
        console.log(message);
        loaded++;
        if (loaded >= total) _this.onReady();
      });
    });
  };

  PlayApp.prototype.render = function(){
    var _this = this;
    var percent = 0;

    this.stars.render(percent);
    // this.music.render(percent);
    this.harmony.render(percent);

    requestAnimationFrame(function(){
      _this.render();
    });
  };

  return PlayApp;

})();

$(function() {
  var app = new PlayApp(CONFIG);
});
