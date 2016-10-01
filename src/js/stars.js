'use strict';

var Stars = (function() {
  function Stars(options) {
    var defaults = {
      container: '#canvas',
      bbox: '#bbox',
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
      maxActive: 16,
      guides: false
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Stars.prototype.init = function(){
    // set dom elements
    this.$container = $(this.opt.container);
    this.$bbox = $(this.opt.bbox);
    if (this.opt.guides) this.$bbox.addClass('guide');
    this.setCanvasValues();

    // determine where to look at initially
    this.alpha = this.opt.alphaStart; // angle from x to z (controlled by pan x)
    this.beta = this.opt.betaStart; // angle from x to y (controlled by pan y)
    this.target = new THREE.Vector3();
    this.origin = new THREE.Vector3(0, 0, 0);
    this.viewChanged = true;

    this.activeStars = [];
    this.loadStars();
  };

  Stars.prototype.drawStarGuides = function(points){
    var $bbox = this.$bbox;
    $bbox.empty();

    // console.log('Points: ', points);

    $.each(points, function(i, point){
      var $star = $('<div class="star"></div>');
      $star.css({
        left: (point.x * 100) + '%',
        top: (point.y * 100) + '%'
      });
      $bbox.append($star);
    });
  };

  Stars.prototype.loadStars = function(){
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

  Stars.prototype.onLoadStarData = function(stars){
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
      // // Guide
      // if (i==0) {
      //   positions[i*3] = 0;
      //   positions[i*3 + 1] = 0;
      //   positions[i*3 + 2] = 100;
      //   colors[i*3] = 0;
      //   colors[i*3 + 1] = 1;
      //   colors[i*3 + 2] = 0;
      //   sizes[i] = 100;
      // }
    });
    this.positions = positions;
    this.sizes = sizes;
    this.originalSizes = sizes.slice();
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

    // render & listen
    this.geometry = geometry;
    this.camera = camera;
    this.renderer = renderer;

    $.publish('stars.loaded', true);
  };

  Stars.prototype.onResize = function(){
    this.setCanvasValues();

    this.camera.aspect = this.containerW / this.containerH;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.containerW, this.containerH);
  };

  Stars.prototype.onPanEnd = function(){
    var maxActive = this.opt.maxActive;
    // console.log(bbox)
    var origin = this.origin;
    var positions = this.positions;
    var triplesLen = parseInt(positions.length/3);
    var pointsInBbox = [];
    // for each star
    for (var i=0; i<triplesLen; i++) {
      var x = positions[i*3];
      var y = positions[i*3+1];
      var z = positions[i*3+2];
      var point = this.pointInBbox(new THREE.Vector3(x, y, z));
      if (point) {
        this.activeStars.push(i);
        pointsInBbox.push(point);
        this.sizes[i] = this.originalSizes[i] * 10;
        if (this.activeStars.length >= maxActive) break;
      }
    }
    if (this.activeStars.length) {
      this.geometry.attributes.size.needsUpdate = true;
      this.onStarsAligned(pointsInBbox);
    }
  };

  Stars.prototype.onPanMove = function(dx, dy){
    var ppd = this.opt.pixelsPerDegree;
    var degreesX = 1.0/(ppd/dx);
    var degreesY = 1.0/(ppd/dy);
    var alpha = this.alpha + degreesX;
    var beta = this.beta - degreesY;
    this.alpha = alpha;
    this.beta = UTIL.lim(beta, this.opt.betaAngleRange[0], this.opt.betaAngleRange[1]);
    this.viewChanged = true;
  };

  Stars.prototype.onPanStart = function(){
    if (!this.activeStars.length) return false;

    // deactivate active stars
    for (var i=0; i<this.activeStars.length; i++){
      var si = this.activeStars[i];
      this.sizes[si] = this.originalSizes[si];
    }
    this.activeStars = [];
    this.geometry.attributes.size.needsUpdate = true;
  };

  Stars.prototype.onStarsAligned = function(pointsInBbox){
    if (this.opt.guides) this.drawStarGuides(pointsInBbox);

    // // guide
    // var p = this.positions;
    // var v3 = new THREE.Vector3(p[0], p[1], p[2]);
    // var v2 = this._vector3ToScreen(v3);
    // console.log(v2.x, v2.y, Math.round(v2.x/this.containerW*100), Math.round(v2.y/this.containerH*100));

    $.publish('stars.aligned', {});
  };

  // get the relative point in the bbox; null if not in bbox
  Stars.prototype.pointInBbox = function(vector3){
    // object not in view
    if (!this._vector3InFrustum(vector3)) return null;
    var vector2 = this._vector3ToScreen(vector3);
    var bbox2 = this.bbox;

    var x = UTIL.norm(vector2.x, bbox2.min.x, bbox2.max.x);
    var y = UTIL.norm(vector2.y, bbox2.min.y, bbox2.max.y);
    if (x > 0 && x < 1 && y > 0 && y < 1) {
      return { x: x, y: y }
    } else {
      return null;
    }
  };

  Stars.prototype.render = function(){
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
  };

  Stars.prototype.setCanvasValues = function(){
    this.containerW = this.$container.width();
    this.containerH = this.$container.height();

    var bbox = this.$bbox[0];
    var x = bbox.offsetLeft;
    var y = bbox.offsetTop;
    var w = this.$bbox.width();
    var h = this.$bbox.height();
    var bboxMin = new THREE.Vector2(x, y);
    var bboxMax = new THREE.Vector2(x+w, y+h);
    this.bbox = new THREE.Box2(bboxMin, bboxMax);
  };

  // http://stackoverflow.com/questions/17624021
  Stars.prototype._vector3InFrustum = function(vector3){
    var frustum = new THREE.Frustum();
    var cameraViewProjectionMatrix = new THREE.Matrix4();

    this.camera.updateMatrixWorld();
    this.camera.matrixWorldInverse.getInverse(this.camera.matrixWorld);
    cameraViewProjectionMatrix.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
    frustum.setFromMatrix(cameraViewProjectionMatrix);

    return frustum.containsPoint(vector3);
  };

  // http://stackoverflow.com/questions/27409074
  Stars.prototype._vector3ToScreen = function(vector3){
    var wh = this.containerW / 2;
    var hh = this.containerH / 2;

    // map to normalized device coordinate (NDC) space
    vector3.project(this.camera);

    // map to 2D screen space
    var x = (vector3.x * wh) + wh;
    var y = (-vector3.y * hh) + hh;

    return new THREE.Vector2(x, y);
  };

  return Stars;

})();
