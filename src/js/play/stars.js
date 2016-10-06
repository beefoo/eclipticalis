'use strict';

var PlayStars = (function() {
  function PlayStars(options) {
    var defaults = {
      alphaAngleRange: [360, 0],
      betaAngleRange: [-15, 15],
      alphaStart: 0,
      betaStart: -15,
    };
    options = $.extend({}, defaults, options);
    Stars.call(this, options);
  }

  // inherit from Stars
  PlayStars.prototype = Object.create(Stars.prototype);
  PlayStars.prototype.constructor = PlayStars;

  PlayStars.prototype.onPanEnd = function(){};

  PlayStars.prototype.render = function(percent){
    this.alpha = UTIL.lerp(this.opt.alphaAngleRange[0], this.opt.alphaAngleRange[1], percent);
    this.beta = UTIL.lerp(this.opt.betaAngleRange[0], this.opt.betaAngleRange[1], percent);

    // console.log(this.alpha, this.beta);

    var vector3 = UTIL.vector3(this.alpha, this.beta, this.opt.far);
    this.target.x = vector3[0];
    this.target.y = vector3[1];
    this.target.z = vector3[2];
    this.camera.lookAt(this.target);
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
