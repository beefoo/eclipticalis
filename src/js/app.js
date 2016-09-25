'use strict';

//=include vendor/jquery-3.1.0.min.js
//=include vendor/underscore-min.js
//=include vendor/three.min.js
//=include components/OrbitControls.js
//=include components/SkyShader.js
//=include components/sky.js
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
    this.init();
  }

  App.prototype.init = function(){
    this.$container = $(this.opt.container);
    this.containerW = this.$container.width();
    this.containerH = this.$container.height();

    this.loadThreeJs();
    this.loadSky();
    this.render();
    this.loadListeners();
  };

  App.prototype.loadListeners = function(){
    var _this = this;

    $(window).on('resize', function(){ _this.onResize(); });
  };

  App.prototype.loadSky = function(){
    this.sky = new Sky({scene: this.scene});
  };

  App.prototype.loadThreeJs = function(){
    var _this = this;

    var camera = new THREE.PerspectiveCamera(this.opt.fov, this.containerW / this.containerH, this.opt.near, this.opt.far);
    camera.position.set(this.opt.position[0], this.opt.position[1], this.opt.position[2]);

    var renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(this.containerW, this.containerH);
    this.$container.append(renderer.domElement);

    var controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.addEventListener('change', function(){ _this.render(); });
    controls.enableZoom = false;
    controls.enablePan = false;

    this.camera = camera;
    this.renderer = renderer;
    this.scene = new THREE.Scene();
  };

  App.prototype.onResize = function(){
    this.containerW = this.$container.width();
    this.containerH = this.$container.height();

    this.camera.aspect = this.containerW / this.containerH;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.containerW, this.containerH);
    this.render();
  };

  App.prototype.render = function(){
    this.renderer.render(this.scene, this.camera);
  };

  return App;

})();

$(function() {
  var app = new App(CONFIG);
});
