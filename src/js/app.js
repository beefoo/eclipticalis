'use strict';

//=include vendor/jquery-3.1.0.min.js
//=include vendor/hammer.min.js
//=include vendor/three.min.js
//=include components/helpers.js
//=include config.js

var App = (function() {
  function App(options) {
    var defaults = {
      container: '#stars',
      dataUrl: 'data/stars.json',
      fov: 40,
      near: 1,
      far: 1000,
      color: 0xffffff,
      texture: "img/star3.png",
      pixelsPerDegree: 10, // how much pan pixels move camera in degrees
      alphaAngleRange: [0, 360], // angle from x to z (controlled by pan x)
      betaAngleRange: [-15, 10], // angle from x to y (controlled by pan y),
      alphaStart: 0,
      betaStart: -2.5
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  App.prototype.init = function(){
    this.$container = $(this.opt.container);
    this.containerW = this.$container.width();
    this.containerH = this.$container.height();

    // determine where to look at initially
    this.alpha = this.opt.alphaStart; // angle from x to z (controlled by pan x)
    this.beta = this.opt.betaStart; // angle from x to y (controlled by pan y)
    this.target = new THREE.Vector3();
    this.viewChanged = true;

    this.loadStars();
  };

  App.prototype.loadListeners = function(){
    var _this = this;
    var panContainer = $('#main')[0];
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

    });

    $(window).on('resize', function(){ _this.onResize(); });
  };

  App.prototype.loadStars = function(){
    var _this = this;

    $.getJSON(this.opt.dataUrl, function(data) {
      var cols = data.cols;
      var rows = data.rows;
      console.log('Loaded '+rows.length+' stars.')
      var stars = [];
      $.each(rows, function(i, row){
        var star = {};
        $.each(cols, function(j, col){
          star[col] = row[j];
        });
        stars.push(star);
      });
      _this.onLoadStarData(stars);
    });
  };

  App.prototype.onLoadStarData = function(stars){
    var _this = this;
    var opt = this.opt;
    var w = this.containerW;
    var h = this.containerH;

    // init camera
    var camera = new THREE.PerspectiveCamera(opt.fov, w/h, opt.near, opt.far);
    camera.position.x = 0;
    camera.position.y = 0;
    camera.position.z = 0;

    this.scene = new THREE.Scene();
    this.scene.position.x = 0;
    this.scene.position.y = 0;
    this.scene.position.z = 0;

    // init stars
    var uniforms = {
      color:     { value: new THREE.Color(opt.color) },
      texture:   { value: new THREE.TextureLoader().load(opt.texture) }
    };
    var shaderMaterial = new THREE.ShaderMaterial( {
      uniforms:       uniforms,
      vertexShader:   document.getElementById('vertexshader').textContent,
      fragmentShader: document.getElementById('fragmentshader').textContent,
      blending:       THREE.AdditiveBlending,
      depthTest:      false,
      transparent:    true
    });

    var geometry = new THREE.BufferGeometry();
    var positions = new Float32Array(stars.length* 3);
    var colors = new Float32Array(stars.length * 3);
    var sizes = new Float32Array(stars.length);
    var size = this.opt.starSize;
    $.each(stars, function(i, star){
      positions[i*3] = star.x;
      positions[i*3 + 1] = star.z;
      positions[i*3 + 2] = star.y;
      colors[i*3] = star.r;
      colors[i*3 + 1] = star.g;
      colors[i*3 + 2] = star.b;
      sizes[i] = star.s;
    });

    // build the scene
    geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.addAttribute('customColor', new THREE.BufferAttribute(colors, 3));
    geometry.addAttribute('size', new THREE.BufferAttribute(sizes, 1));
    var starSystem = new THREE.Points(geometry, shaderMaterial);
    this.scene.add(starSystem);

    // load renderer
    var renderer = new THREE.WebGLRenderer({alpha: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(w, h);
    this.$container.append(renderer.domElement);

    // render & listen
    this.camera = camera;
    this.renderer = renderer;
    this.render();
    this.loadListeners();
  };

  App.prototype.onResize = function(){
    this.containerW = this.$container.width();
    this.containerH = this.$container.height();

    this.camera.aspect = this.containerW / this.containerH;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.containerW, this.containerH);
  };

  App.prototype.onPanMove = function(dx, dy){
    var ppd = this.opt.pixelsPerDegree;
    var degreesX = 1.0/(ppd/dx);
    var degreesY = 1.0/(ppd/dy);
    var alpha = this.alpha + degreesX;
    var beta = this.beta - degreesY;
    this.alpha = alpha;
    this.beta = UTIL.lim(beta, this.opt.betaAngleRange[0], this.opt.betaAngleRange[1]);
    this.viewChanged = true;
  };

  App.prototype.render = function(){
    var _this = this;

    if (this.viewChanged) {
      var vector3 = UTIL.vector3(this.alpha, this.beta, this.opt.far);
      this.target.x = vector3[0];
      this.target.y = vector3[1];
      this.target.z = vector3[2];
      this.camera.lookAt(this.target);
      this.viewChanged = false;
    }

    this.renderer.render(this.scene, this.camera);

    requestAnimationFrame(function(){
      _this.render();
    });
  };

  return App;

})();

$(function() {
  var app = new App(CONFIG);
});
