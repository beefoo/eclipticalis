// Utility functions
(function() {
  window.UTIL = {};

  UTIL.degreesToTime = function(degrees) {
    var d = UTIL.normDegrees(degrees);
    var h = Math.floor(d / 15);
    var m = Math.floor(d % 15 / 15 * 60);
    return h + 'h ' + m + 'm';
  };

  UTIL.lerp = function(a, b, percent) {
    return (1.0*b - a) * percent + a;
  };

  UTIL.lim = function(num, min, max) {
    if (num < min) return min;
    if (num > max) return max;
    return num;
  };

  UTIL.norm = function(value, a, b){
    return (1.0 * value - a) / (b - a);
  };

  UTIL.mean = function(arr){
    var len = arr.length;
    var sum = 0;
    for(var i=0; i<len; i++) {
      sum += arr[i];
    }
    return sum / len;
  };

  UTIL.normDegrees = function(degrees){
    degrees = degrees % 360;
    if (degrees < 0) degrees += 360;
    return degrees;
  };

  UTIL.rad = function(degrees) {
    return degrees * (Math.PI / 180);
  };

  UTIL.round = function(value, precision) {
    return value.toFixed(precision);
  };

  UTIL.sin = function(progress) {
    var radians = progress * Math.PI;
    return Math.sin(radians);
  };

  UTIL.vector3 = function(alpha, beta, length) {
    alpha = UTIL.rad(alpha);
    beta = UTIL.rad(beta);
    var x = length * Math.cos(alpha) * Math.cos(beta);
    var z = length * Math.sin(alpha) * Math.cos(beta);
    var y = length * Math.sin(beta);
    return [x, y, z];
  };

})();
