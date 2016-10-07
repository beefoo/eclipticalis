'use strict';

//=include vendor/jquery-3.1.0.min.js
//=include vendor/ba-tiny-pubsub.min.js
//=include vendor/hammer.min.js
//=include vendor/three.min.js
//=include vendor/howler.core.min.js
//=include helpers.js
//=include config.js
//=include music.js
//=include harmony.js
//=include stars.js

var App = (function() {
  function App(options) {
    var defaults = {
      container: '#main',
      barMs: 6000
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  App.prototype.init = function(){
    var _this = this;

    this.seqStart = 0;

    // wait for stars and music to be loaded
    this.queueSubscriptions(['stars.loaded', 'music.loaded', 'harmony.loaded']);

    // load stars and music
    this.music = new Music(this.opt.music);
    this.harmony = new Harmony(this.opt.harmony);
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

    $('.toggle-volume').on('click', function(e){
      e.preventDefault();
      var $link = $(this);
      $link.toggleClass('on');
      var isOn = $link.hasClass('on');
      if (isOn) $link.text($link.attr('data-on'));
      else $link.text($link.attr('data-off'));
      $.publish('volume.toggle', isOn);
    })

    // stars aligned
    $.subscribe('stars.aligned', function(e, data){
      var t = new Date();
      _this.seqStart = t.getTime();
    });
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
    $('.instructions').removeClass('active');
    this.stars.onPanStart();
    this.music.onPanStart();
  };

  App.prototype.onReady = function(){
    $('.loading').hide();
    $('.instructions').show().addClass('active');
    this.loadListeners();
    this.render();
  };

  App.prototype.queueSubscriptions = function(subs){
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

  App.prototype.render = function(){
    var _this = this;

    var progress = -1;
    if (this.seqStart) {
      var barMs = this.opt.barMs;
      var t = new Date();
      var ms = t.getTime();
      var msSinceStart = ms - this.seqStart;
      var remainder = msSinceStart % barMs;
      progress = remainder / barMs;
    }

    this.stars.render(progress);
    this.music.render(progress);
    this.harmony.render(progress);

    requestAnimationFrame(function(){
      _this.render();
    });
  };

  return App;

})();

$(function() {
  var app = new App(CONFIG);
});
