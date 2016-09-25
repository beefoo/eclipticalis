'use strict';

//=include vendor/jquery-3.1.0.min.js
//=include vendor/underscore-min.js
//=include vendor/hammer.min.js
//=include vendor/three.min.js
//=include config.js

var App = (function() {
  function App(options) {
    var defaults = {
      container: '#stars',
      fov: 40,
      near: 1,
      far: 10000,
      posZ: 0,
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

    this.target = new THREE.Vector3(this.opt.radius, this.opt.radius, this.opt.radius);

    this.loadStars();
    this.loadListeners();
    this.render();
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
    var particles = 1000;
    var radius = opt.radius;
    var geometry = new THREE.BufferGeometry();
    var positions = new Float32Array(particles* 3);
    var colors = new Float32Array(particles * 3);
    var sizes = new Float32Array((particles));
    var color = new THREE.Color();
    for ( var i = 0, i3 = 0; i < particles; i ++, i3 += 3 ) {
      var px = 0, py = 0, pz = 0;
      var cr = 255, cg = 255, cb = 255;
      var size = 200;
      if (i==1) {
        px = radius;
        py = radius;
        pz = radius;
        cg = 0;
        cb = 0;

      } else if (i > 1) {
        px = ( Math.random() * 2 - 1 ) * radius;
        py = ( Math.random() * 2 - 1 ) * radius;
        pz = ( Math.random() * 2 - 1 ) * radius;
        color.setHSL(i / particles, 0.2, 0.7);
        cr = color.r;
        cg = color.g;
        cb = color.b;
        size = 20;
      }

      positions[ i3 + 0 ] = px;
      positions[ i3 + 1 ] = py;
      positions[ i3 + 2 ] = pz;
      colors[ i3 + 0 ] = cr;
      colors[ i3 + 1 ] = cg;
      colors[ i3 + 2 ] = cb;
      sizes[ i ] = size;
    }

    geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.addAttribute('customColor', new THREE.BufferAttribute(colors, 3));
    geometry.addAttribute('size', new THREE.BufferAttribute(sizes, 1));

    var starSystem = new THREE.Points(geometry, shaderMaterial);
    this.scene.add(starSystem);

    var renderer = new THREE.WebGLRenderer({alpha: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(w, h);

    this.$container.append(renderer.domElement);

    this.camera = camera;
    this.renderer = renderer;
  };

  App.prototype.onResize = function(){
    this.containerW = this.$container.width();
    this.containerH = this.$container.height();

    this.camera.aspect = this.containerW / this.containerH;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.containerW, this.containerH);
  };

  App.prototype.onPanMove = function(dx, dy){
    this.target.x += dx;
    this.target.y += dy;
  };

  App.prototype.render = function(){
    var _this = this;

    this.camera.lookAt(this.target);

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
