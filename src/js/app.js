'use strict';

//=include vendor/jquery-3.1.0.min.js
//=include vendor/ba-tiny-pubsub.min.js
//=include vendor/hammer.min.js
//=include vendor/three.min.js
//=include vendor/howler.core.min.js
//=include helpers.js
//=include config.js
//=include music.js
//=include stars.js

var App = (function() {
  function App(options) {
    var defaults = {
      container: '#main'
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  App.prototype.init = function(){
    var _this = this;

    // wait for stars and music to be loaded
    var starsLoaded = false;
    var musicLoaded = false;
    $.subscribe('stars.loaded', function(){
      console.log('Stars ready.');
      if (musicLoaded) _this.onReady();
      else starsLoaded = true;
    });
    $.subscribe('music.loaded', function(){
      console.log('Music ready.');
      if (starsLoaded) _this.onReady();
      else musicLoaded = true;
    });

    // load stars and music
    this.music = new Music(this.opt.music);
    this.stars = new Stars(this.opt.stars);
  };

  App.prototype.loadListeners = function(){
    var _this = this;
    var panContainer = $(this.opt.container)[0];
    var x0 = -1;
    var y0 = -1;
    var x = -1;
    var y = -1;

    var h = new Hammer(panContainer, {});
    h.get('pan').set({ direction: Hammer.DIRECTION_ALL });

    // pan start
    h.on('panstart', function(e){
      x0 = e.center.x;
      y0 = e.center.y;
      _this.onPanStart();
    });

    // pan move
    h.on('panmove', function(e){
      x = e.center.x;
      y = e.center.y;
      _this.onPanMove(x0 - x, y0 - y);
      x0 = x;
      y0 = y;
    });

    // pan end
    h.on('panend', function(e){
      _this.onPanEnd();
    });

    // resize
    $(window).on('resize', function(){ _this.onResize(); });
  };

  App.prototype.onResize = function(){
    this.stars.onResize();
  };

  App.prototype.onPanEnd = function(){
    this.stars.onPanEnd();
  };

  App.prototype.onPanMove = function(dx, dy){
    this.stars.onPanMove(dx, dy);
  };

  App.prototype.onPanStart = function(){
    this.stars.onPanStart();
  };

  App.prototype.onReady = function(){
    $('.loading').hide();
    this.loadListeners();
    this.render();
  };

  App.prototype.render = function(){
    var _this = this;
    var t = new Date();

    this.stars.render(t);
    this.music.render(t);

    requestAnimationFrame(function(){
      _this.render();
    });
  };

  return App;

})();

$(function() {
  var app = new App(CONFIG);
});
