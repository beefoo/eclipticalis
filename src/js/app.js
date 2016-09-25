'use strict';

//=include vendor/jquery-3.1.0.min.js
//=include vendor/underscore-min.js
//=include vendor/three.min.js
//=include config.js

var App = (function() {
  function App(options) {
    var defaults = {
      container: '#main',
      fov: 60,
      near: 100,
      far: 2000000,
      position: [0, 100, 2000]
    };
    this.opt = _.extend({}, defaults, options);
    // this.init();
  }

  App.prototype.init = function(){
    this.$container = $(this.opt.container);
    this.containerW = this.$container.width();
    this.containerH = this.$container.height();

    this.loadThreeJs();
    this.render();
    this.loadListeners();
  };

  App.prototype.loadListeners = function(){
    var _this = this;

    $(window).on('resize', function(){ _this.onResize(); });
  };

  App.prototype.loadThreeJs = function(){
    var _this = this;
  };

  App.prototype.onResize = function(){
    // this.containerW = this.$container.width();
    // this.containerH = this.$container.height();
    //
    // this.camera.aspect = this.containerW / this.containerH;
    // this.camera.updateProjectionMatrix();
    // this.renderer.setSize(this.containerW, this.containerH);
    // this.render();
  };

  App.prototype.render = function(){
    // this.renderer.render(this.scene, this.camera);
  };

  return App;

})();

$(function() {
  var app = new App(CONFIG);
});
