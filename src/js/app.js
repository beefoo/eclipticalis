'use strict';

//=include vendor/jquery-3.1.0.min.js
//=include vendor/hammer.min.js
//=include vendor/three.min.js
//=include helpers.js
//=include config.js

var App = (function() {
  function App(options) {
    var defaults = {
      container: '#stars',
      dataUrl: 'data/stars.json',
      fov: 30,
      near: 1,
      far: 1000,
      color: 0xffffff,
      texture: "img/star3.png",
      pixelsPerDegree: 10, // how much pan pixels move camera in degrees
      alphaAngleRange: [0, 360], // angle from x to z (controlled by pan x)
      betaAngleRange: [-15, 10], // angle from x to y (controlled by pan y),
      alphaStart: 0,
      betaStart: -2.5,
      maxActive: 24,
      bbAlphaRadius: 15,
      bbBetaRadius: 3,
      bbAlphaOffset: 3,
      bbBetaOffset: 3,
      guides: true
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
    this.origin = new THREE.Vector3(0, 0, 0);
    this.viewChanged = true;

    this.activeStars = [];
    this.loadStars();
  };

  App.prototype.getBoundingBox = function(){
    var bbAlpha = this.opt.bbAlpha;
    var bbBeta = this.opt.bbBeta;
    var tl = UTIL.vector3(this.alpha - bbAlpha, this.beta + bbBeta, 10);
    var br = UTIL.vector3(this.alpha + bbAlpha, this.beta - bbBeta, 10);
    var min = new THREE.Vector3(tl[0], tl[1], tl[2]);
    var max = new THREE.Vector3(br[0], br[1], br[2]);
    return new Box3(min, max);
  };

  App.prototype.guideDraw = function(){
    var geometry = new THREE.Geometry();
    var vertices = this.guideVertices();
    geometry.vertices = vertices;
    var material = new THREE.LineBasicMaterial({
      color: 0xff0000
    });
    var bbox = new THREE.LineSegments(geometry, material);
    this.guideGeo = geometry;
    this.scene.add(bbox);
  };

  App.prototype.guideUpdate = function(){
    var vertices = this.guideVertices();
    for (var i=0; i<this.guideGeo.vertices.length; i++) {
      this.guideGeo.vertices[i].x = vertices[i].x;
      this.guideGeo.vertices[i].y = vertices[i].y;
      this.guideGeo.vertices[i].z = vertices[i].z;
    }
    this.guideGeo.verticesNeedUpdate = true;
  };

  App.prototype.guideVertices = function(){
    var arad = this.opt.bbAlphaRadius;
    var brad = this.opt.bbBetaRadius;
    var aoff = this.opt.bbAlphaOffset;
    var boff = this.opt.bbBetaOffset;
    var tl = UTIL.vector3(this.alpha - arad + aoff, this.beta + brad + boff, 10);
    var tr = UTIL.vector3(this.alpha + arad + aoff, this.beta + brad + boff, 10);
    var bl = UTIL.vector3(this.alpha - arad + aoff, this.beta - brad + boff, 10);
    var br = UTIL.vector3(this.alpha + arad + aoff, this.beta - brad + boff, 10);

    return [
      new THREE.Vector3(tl[0], tl[1], tl[2]), new THREE.Vector3(tr[0], tr[1], tr[2]),
      new THREE.Vector3(tr[0], tr[1], tr[2]), new THREE.Vector3(br[0], br[1], br[2]),
      new THREE.Vector3(bl[0], bl[1], bl[2]), new THREE.Vector3(br[0], br[1], br[2]),
      new THREE.Vector3(bl[0], bl[1], bl[2]), new THREE.Vector3(tl[0], tl[1], tl[2])
    ];
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
      _this.onPanEnd();
    });

    $(window).on('resize', function(){ _this.onResize(); });
  };

  App.prototype.loadStars = function(){
    var _this = this;
    var starLen = 0;

    $.getJSON(this.opt.dataUrl, function(data) {
      var cols = data.cols;
      var rows = data.rows;
      starLen = rows.length;
      console.log('Loaded '+starLen+' stars.')
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

    this.starLen = starLen;
    this.starIndex = Array.apply(null, {length: starLen}).map(Number.call, Number);
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
    this.sizes = sizes;
    // this.colors = colors;

    // build the scene
    geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.addAttribute('customColor', new THREE.BufferAttribute(colors, 3));
    geometry.addAttribute('size', new THREE.BufferAttribute(this.sizes, 1));
    var starSystem = new THREE.Points(geometry, shaderMaterial);
    this.scene.add(starSystem);

    // load renderer
    var renderer = new THREE.WebGLRenderer({alpha: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(w, h);
    this.$container.append(renderer.domElement);

    if (this.opt.guides) this.guideDraw();

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

  App.prototype.onPanEnd = function(){
    if (this.opt.guides) this.guideUpdate();
    // find new active stars
    // this.activeStars = [];
    //
    // var bbox = this.bbox;
    // var origin = this.origin;
    // // for each star
    //   var ray = new THREE.Ray(origin,  new THREE.Vector3(0, 0, 0));
    //   var intersection = ray.intersectBox(bbox);
    //   if (intersection) {
    //     // add to active
    //     // break if max reached
    //   }
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

  App.prototype.onPanStart = function(){
    // deactivate active stars
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
