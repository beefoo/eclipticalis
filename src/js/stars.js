'use strict';

var Stars = (function() {
  function Stars(options) {
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
      maxActive: 16,
      bbAlphaRadius: 12,
      bbBetaRadius: 2,
      bbAlphaOffset: 2,
      bbBetaOffset: 3.2,
      bbDistance: 100,
      guides: true
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Stars.prototype.init = function(){
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

  Stars.prototype.getBoundingBox = function(){
    var arad = this.opt.bbAlphaRadius;
    var brad = this.opt.bbBetaRadius;
    var aoff = this.opt.bbAlphaOffset;
    var boff = this.opt.bbBetaOffset;
    var bbd = this.opt.bbDistance;
    var tl = UTIL.vector3(this.alpha - arad + aoff, this.beta + brad + boff, bbd);
    var br = UTIL.vector3(this.alpha + arad + aoff, this.beta - brad + boff, bbd);
    var minX = Math.min(tl[0], br[0]); var minY = Math.min(tl[1], br[1]); var minZ = Math.min(tl[2], br[2]);
    var maxX = Math.max(tl[0], br[0]); var maxY = Math.max(tl[1], br[1]); var maxZ = Math.max(tl[2], br[2]);
    var min = new THREE.Vector3(minX, minY, minZ);
    var max = new THREE.Vector3(maxX, maxY, maxZ);
    return new THREE.Box3(min, max);
  };

  Stars.prototype.guideDraw = function(){
    var geometry = new THREE.Geometry();
    var vertices = this.guideVertices();
    geometry.vertices = vertices;
    var material = new THREE.LineBasicMaterial({
      color: 0xff0000
    });
    var bbox = new THREE.LineSegments(geometry, material);
    bbox.frustumCulled = false;

    this.guideGeo = geometry;
    this.scene.add(bbox);
  };

  Stars.prototype.guideUpdate = function(){
    var vertices = this.guideVertices();
    for (var i=0; i<this.guideGeo.vertices.length; i++) {
      this.guideGeo.vertices[i].x = vertices[i].x;
      this.guideGeo.vertices[i].y = vertices[i].y;
      this.guideGeo.vertices[i].z = vertices[i].z;
    }
    this.guideGeo.verticesNeedUpdate = true;
  };

  Stars.prototype.guideVertices = function(){
    var arad = this.opt.bbAlphaRadius;
    var brad = this.opt.bbBetaRadius;
    var aoff = this.opt.bbAlphaOffset;
    var boff = this.opt.bbBetaOffset;
    var bbd = this.opt.bbDistance;
    var tl = UTIL.vector3(this.alpha - arad + aoff, this.beta + brad + boff, bbd);
    var tr = UTIL.vector3(this.alpha + arad + aoff, this.beta + brad + boff, bbd);
    var bl = UTIL.vector3(this.alpha - arad + aoff, this.beta - brad + boff, bbd);
    var br = UTIL.vector3(this.alpha + arad + aoff, this.beta - brad + boff, bbd);
    return [
      new THREE.Vector3(tl[0], tl[1], tl[2]), new THREE.Vector3(tr[0], tr[1], tr[2]),
      new THREE.Vector3(tr[0], tr[1], tr[2]), new THREE.Vector3(br[0], br[1], br[2]),
      new THREE.Vector3(bl[0], bl[1], bl[2]), new THREE.Vector3(br[0], br[1], br[2]),
      new THREE.Vector3(bl[0], bl[1], bl[2]), new THREE.Vector3(tl[0], tl[1], tl[2])
    ];
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

    if (this.opt.guides) this.guideDraw();

    // render & listen
    this.geometry = geometry;
    this.camera = camera;
    this.renderer = renderer;

    $.publish('stars.loaded', true);
  };

  Stars.prototype.onResize = function(){
    this.containerW = this.$container.width();
    this.containerH = this.$container.height();

    this.camera.aspect = this.containerW / this.containerH;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.containerW, this.containerH);
  };

  Stars.prototype.onPanEnd = function(){
    if (this.opt.guides) this.guideUpdate();

    var maxActive = this.opt.maxActive;
    var bbox = this.getBoundingBox();
    // console.log(bbox)
    var origin = this.origin;
    var positions = this.positions;
    var triplesLen = parseInt(positions.length/3);
    var intersections = [];
    // for each star
    for (var i=0; i<triplesLen; i++) {
      var x = positions[i*3];
      var y = positions[i*3+1];
      var z = positions[i*3+2];
      var ray = new THREE.Ray(origin,  new THREE.Vector3(x, y, z));
      var intersection = ray.intersectBox(bbox);
      if (intersection) {
        this.activeStars.push(i);
        intersections.push(intersection);
        this.sizes[i] = this.originalSizes[i] * 10;
        if (this.activeStars.length >= maxActive) break;
      }
    }
    if (this.activeStars.length) {
      this.geometry.attributes.size.needsUpdate = true;
      $.publish('stars.aligned', {
        intersections: intersections,
        bbox: bbox
      });
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

  return Stars;

})();
