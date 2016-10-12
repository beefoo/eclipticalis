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
      betaAngleRange: [-30, 30], // angle from x to y (controlled by pan y),
      alphaStart: 0,
      betaStart: -2.5,
      maxActive: 16,
      flashDuration: 0.2,
      flashMultiplier: 15,
      guides: false
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Stars.prototype.init = function(){
    this.initCanvas();
    this.initCamera();

    this.activeStars = [];
    this.loadStars();
  };

  Stars.prototype.initCamera = function(){
    // determine where to look at initially
    this.alpha = this.opt.alphaStart; // angle from x to z (controlled by pan x)
    this.beta = this.opt.betaStart; // angle from x to y (controlled by pan y)
    this.target = new THREE.Vector3();
    this.origin = new THREE.Vector3(0, 0, 0);
    this.viewChanged = true;
  };

  Stars.prototype.initCanvas = function(){
    // set dom elements
    this.$container = $(this.opt.container);
    this.$bbox = $(this.opt.bbox);
    if (this.opt.guides) this.$bbox.addClass('guide');
    this.setCanvasValues();
  };

  Stars.prototype.drawStarGuides = function(points){
    var $bbox = this.$bbox;
    $bbox.empty();

    // console.log('Points: ', points);

    $.each(points, function(i, point){
      var $star = $('<div class="star"></div>');
      $star.css({
        left: (point.x * 100) + '%',
        bottom: (point.y * 100) + '%'
      });
      $bbox.append($star);
    });
  };

  Stars.prototype.loadStars = function(){
    var _this = this;

    $.getJSON(this.opt.dataUrl, function(data) {
      var cols = data.cols;
      var rows = data.rows;
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

  Stars.prototype.onLoadStarData = function(stars){
    var _this = this;
    var opt = this.opt;
    var w = this.containerW;
    var h = this.containerH;
    var starLen = stars.length;

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
    var positions = new Float32Array(starLen* 3);
    var colors = new Float32Array(starLen * 3);
    var sizes = new Float32Array(starLen);
    var size = this.opt.starSize;
    var mags = new Float32Array(starLen);
    $.each(stars, function(i, star){
      positions[i*3] = star.x;
      positions[i*3 + 1] = star.z;
      positions[i*3 + 2] = -star.y;
      colors[i*3] = star.r;
      colors[i*3 + 1] = star.g;
      colors[i*3 + 2] = star.b;
      sizes[i] = star.s;
      mags[i] = star.m;
    });
    this.positions = positions;
    this.sizes = sizes;
    this.originalSizes = sizes.slice();
    this.mags = mags;
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
    this.starLen = starLen;

    $.publish('stars.loaded', {
      message: 'Loaded ' + starLen + ' stars.',
      count: starLen,
      stars: stars
    });
    setTimeout(function(){_this.onPanEnd();}, 1000);
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
    var triplesLen = this.starLen;
    var pointsInBbox = [];
    // for each star
    for (var i=0; i<triplesLen; i++) {
      var x = positions[i*3];
      var y = positions[i*3+1];
      var z = positions[i*3+2];
      var point = this.pointInBbox(new THREE.Vector3(x, y, z));
      if (point) {
        point.i = i;
        pointsInBbox.push(point);
        if (pointsInBbox.length >= maxActive) break;
      }
    }
    if (pointsInBbox.length) {
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
      var star = this.activeStars[i];
      var si = star.i;
      this.sizes[si] = this.originalSizes[si];
    }
    this.activeStars = [];
    this.geometry.attributes.size.needsUpdate = true;
  };

  Stars.prototype.onStarsAligned = function(points){
    if (this.opt.guides) this.drawStarGuides(points);

    // sort by x
    points.sort(function(a, b){
      if(a.x < b.x) return -1;
      if(a.x > b.x) return 1;
      return 0;
    });

    // add start/end
    var dur = this.opt.flashDuration;
    var mags = this.mags;
    points = points.map(function(point){
       point.start = point.x * (1-dur);
       point.end = point.start + dur;
       point.end = Math.min(point.end, 1);
       point.mag = mags[point.i];
      //  if (point.start > (1-dur)) {
      //    point.start = (1-dur);
      //    point.end = 1;
      //  }
       return point;
    });
    this.activeStars = points;

    // also send position
    var alpha = this.alpha;
    var beta = this.beta;
    var alphaRange = this.opt.alphaAngleRange;
    var betaRange = this.opt.betaAngleRange;

    $.publish('stars.aligned', {
      points: points,
      position: {
        alpha: UTIL.norm(alpha, alphaRange[0], alphaRange[1]),
        beta: UTIL.norm(beta, betaRange[0], betaRange[1])
      }
    });
  };

  // get the relative point in the bbox; null if not in bbox
  Stars.prototype.pointInBbox = function(vector3){
    // object not in view
    if (!this._vector3InFrustum(vector3)) return null;
    var vector2 = this._vector3ToScreen(vector3);
    var bbox2 = this.bbox;

    var x = UTIL.norm(vector2.x, bbox2.min.x, bbox2.max.x);
    var y = 1.0 - UTIL.norm(vector2.y, bbox2.min.y, bbox2.max.y);
    if (x > 0 && x < 1 && y > 0 && y < 1) {
      return { x: x, y: y }
    } else {
      return null;
    }
  };

  Stars.prototype.render = function(progress){
    var _this = this;

    if (this.viewChanged) {
      var vector3 = UTIL.vector3(this.alpha, this.beta, this.opt.far);
      this.target.x = vector3[0];
      this.target.y = vector3[1];
      this.target.z = vector3[2];
      this.camera.lookAt(this.target);
      this.renderStatus();
      this.viewChanged = false;
    }

    if (this.activeStars.length && progress >= 0) {
      this.renderStars(progress);
    }

    this.renderer.render(this.scene, this.camera);
  };

  Stars.prototype.renderStars = function(progress){
    var mult = this.opt.flashMultiplier;

    for (var i=this.activeStars.length-1; i>=0; i--){
      var star = this.activeStars[i];
      var si = star.i;
      // flashing star
      if (progress > star.start && progress < star.end) {
        var p = UTIL.norm(progress, star.start, star.end);
        p = UTIL.sin(p);
        var flashAmount = UTIL.lerp(1, mult, p);
        this.sizes[si] = this.originalSizes[si] * flashAmount;
      // not flashing
      } else {
        this.sizes[si] = this.originalSizes[si];
      }
    }

    this.geometry.attributes.size.needsUpdate = true;
  };

  Stars.prototype.renderStatus = function(){
    var ra = UTIL.degreesToTime(360 - this.alpha);
    var dec = UTIL.round(this.beta, 1) + '°';
    if (this.beta >= 0) dec = '+' + dec;
    $('.ra').text(ra);
    $('.dec').text(dec);
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
