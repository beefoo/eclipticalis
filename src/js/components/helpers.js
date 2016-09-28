// Utility functions
(function() {
  window.UTIL = {};

  UTIL.lim = function(num, min, max) {
    if (num < min) return min;
    if (num > max) return max;
    return num;
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

  UTIL.vector3 = function(alpha, beta, length) {
    alpha = UTIL.rad(alpha);
    beta = UTIL.rad(beta);
    var x = length * Math.cos(alpha) * Math.cos(beta);
    var z = length * Math.sin(alpha) * Math.cos(beta);
    var y = length * Math.sin(beta);
    return [x, y, z];
  };

})();
