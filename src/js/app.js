'use strict';

//=include vendor/jquery-3.1.0.min.js
//=include vendor/underscore-min.js
//=include vendor/three.min.js
//=include config.js

var App = (function() {
  function App(options) {
    var defaults = {
      container: '#stars',
      fov: 40,
      near: 1,
      far: 10000,
      pos: [0, 0, 300],
      color: 0xffffff,
      texture: "img/star.png",
      radius: 200
    };
    this.opt = _.extend({}, defaults, options);
    this.init();
  }

  App.prototype.init = function(){
    this.$container = $(this.opt.container);
    this.containerW = this.$container.width();
    this.containerH = this.$container.height();

    this.loadStars();
    this.loadListeners();
  };

  App.prototype.loadListeners = function(){
    var _this = this;

    $(window).on('resize', function(){ _this.onResize(); });
  };

  App.prototype.loadStars = function(){
    var _this = this;
    var opt = this.opt;
    var w = this.containerW;
    var h = this.containerH;

    // init camera
    var camera = new THREE.PerspectiveCamera(opt.fov, w/h, opt.near, opt.far);
    camera.position.x = opt.pos[0];
    camera.position.y = opt.pos[1];
    camera.position.z = opt.pos[2];

    this.scene = new THREE.Scene();

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
    var particles = 1000;
    var radius = opt.radius;
    var geometry = new THREE.BufferGeometry();
    var positions = new Float32Array(particles * 3);
    var colors = new Float32Array(particles * 3);
    var sizes = new Float32Array(particles);
    var color = new THREE.Color();
    for ( var i = 0, i3 = 0; i < particles; i ++, i3 += 3 ) {
      positions[ i3 + 0 ] = ( Math.random() * 2 - 1 ) * radius;
      positions[ i3 + 1 ] = ( Math.random() * 2 - 1 ) * radius;
      positions[ i3 + 2 ] = ( Math.random() * 2 - 1 ) * radius;
      color.setHSL(i / particles, 0.2, 0.7);
      colors[ i3 + 0 ] = color.r;
      colors[ i3 + 1 ] = color.g;
      colors[ i3 + 2 ] = color.b;
      sizes[ i ] = 20;
    }
    geometry.addAttribute('position', new THREE.BufferAttribute( positions, 3 ));
    geometry.addAttribute('customColor', new THREE.BufferAttribute( colors, 3 ));
    geometry.addAttribute('size', new THREE.BufferAttribute( sizes, 1 ));

    var starSystem = new THREE.Points(geometry, shaderMaterial);
    this.scene.add(starSystem);

    var renderer = new THREE.WebGLRenderer({alpha: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(w, h);

    this.$container.append(renderer.domElement);

    this.camera = camera;
    this.renderer = renderer;
    setTimeout(function(){_this.render();}, 100);
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
