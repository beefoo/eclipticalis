'use strict';

var PlayStars = (function() {
  function PlayStars(options) {
    var defaults = {
      alphaAngleRange: [360, 0],
      betaAngleRange: [-30, 30],
      alphaStart: 0,
      betaStart: -30,
      crossedX: 0.5
    };
    options = $.extend({}, defaults, options);
    Stars.call(this, options);
  }

  // inherit from Stars
  PlayStars.prototype = Object.create(Stars.prototype);
  PlayStars.prototype.constructor = PlayStars;

  PlayStars.prototype.init = function(){
    this.initCanvas();
    this.initCamera();

    this.recordMode = this.opt.recordMode;
    this.crossedX = this.opt.crossedX;
    this.activeStars = [];
    this.sequence = [];

    this.loadStars();
  };

  PlayStars.prototype.downloadSequence = function(){
    var sequence = this.sequence;
    var data = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sequence));
    window.open(data, "", "_blank");
  }

  PlayStars.prototype.loadCrossed = function(count){
    var crossed = new Float32Array(count);
    for (var i=0; i<count; i++) {
      crossed[i] = 0;
    }
    this.crossed = crossed;
    return this.crossed;
  };

  PlayStars.prototype.onPanEnd = function(){};

  PlayStars.prototype.recordSequence = function(percent){
    var starLen = this.starLen;
    var positions = this.positions;
    var crossed = this.crossed || this.loadCrossed(starLen);
    var crossedX = this.crossedX;
    // reset the 2nd time around
    if (percent >= 0.5 && !this.resentCrossed) {
      this.resentCrossed = true;
      crossed = this.loadCrossed(starLen);
    }
    // for each star
    for (var i=0; i<starLen; i++) {
      var c = crossed[i];
      if (c > 0) continue; // already crossed
      var x = positions[i*3];
      var y = positions[i*3+1];
      var z = positions[i*3+2];

      var point = this.pointInBbox(new THREE.Vector3(x, y, z));
      // in bbox
      if (point) {
        // point is left of cross, not seen yet
        if (point.x < crossedX && c===0) {
          this.crossed[i] = -1;
        }
        // it crossed
        else if (point.x > crossedX && c < 0) {
          this.crossed[i] = 1;
          this.sequence.push([percent, i, point.y]);
          $('.count').text(this.sequence.length);
        }
      }
    }
  };

  PlayStars.prototype.render = function(percent){
    var alphaPercent = 0;
    var betaPercent = 0;
    if (percent < 0.5) {
      alphaPercent = UTIL.norm(percent, 0, 0.5);
      betaPercent = alphaPercent;
    } else {
      alphaPercent = UTIL.norm(percent, 0.5, 1);
      betaPercent = 1.0 - alphaPercent;
    }

    this.alpha = UTIL.lerp(this.opt.alphaAngleRange[0], this.opt.alphaAngleRange[1], alphaPercent);
    this.beta = UTIL.lerp(this.opt.betaAngleRange[0], this.opt.betaAngleRange[1], betaPercent);

    // console.log(this.alpha, this.beta);

    var vector3 = UTIL.vector3(this.alpha, this.beta, this.opt.far);
    this.target.x = vector3[0];
    this.target.y = vector3[1];
    this.target.z = vector3[2];
    this.camera.lookAt(this.target);

    if (this.recordMode) {
      this.recordSequence(percent);
    }

    this.renderStatus();
    // this.geometry.attributes.size.needsUpdate = true;
    this.renderer.render(this.scene, this.camera);
  };

  PlayStars.prototype.renderStars = function(progress){
    // var mult = this.opt.flashMultiplier;
    //
    // for (var i=this.activeStars.length-1; i>=0; i--){
    //   var star = this.activeStars[i];
    //   var si = star.i;
    //   // flashing star
    //   if (progress > star.start && progress < star.end) {
    //     var p = UTIL.norm(progress, star.start, star.end);
    //     p = UTIL.sin(p);
    //     var flashAmount = UTIL.lerp(1, mult, p);
    //     this.sizes[si] = this.originalSizes[si] * flashAmount;
    //   // not flashing
    //   } else {
    //     this.sizes[si] = this.originalSizes[si];
    //   }
    // }
    //
    // this.geometry.attributes.size.needsUpdate = true;
  };

  return PlayStars;

})();
