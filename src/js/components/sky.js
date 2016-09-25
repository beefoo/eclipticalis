var Sky = (function() {
  function Sky(options) {
    var defaults = {
      sun: {
        turbidity: 10,
        reileigh: 2,
        mieCoefficient: 0.005,
        mieDirectionalG: 0.8,
        luminance: 1,
        inclination: 0.49, // elevation / inclination
        azimuth: 0.25, // Facing front,
        visible: false,
        distance: 400000,
        color: 0xffffff,
        radius: 20000,
        widthSegments: 16,
        heightSegments: 8
      }
    };
    this.opt = _.extend({}, defaults, options);
    this.init();
  }

  Sky.prototype.init = function(){
    this.scene = this.opt.scene;

    // Add Sky Mesh
    var sky = new THREE.Sky();
    this.scene.add(sky.mesh);

    // Add Sun Helper
    var sun = this.opt.sun;
    var sunSphere = new THREE.Mesh(
      new THREE.SphereBufferGeometry(sun.radius, sun.widthSegments, sun.heightSegments),
      new THREE.MeshBasicMaterial({color: sun.color})
    );
    var uniforms = sky.uniforms;
    uniforms.turbidity.value = sun.turbidity;
    uniforms.reileigh.value = sun.reileigh;
    uniforms.luminance.value = sun.luminance;
    uniforms.mieCoefficient.value = sun.mieCoefficient;
    uniforms.mieDirectionalG.value = sun.mieDirectionalG;
    var distance = sun.distance;
    var theta = Math.PI * (sun.inclination - 0.5);
    var phi = 2 * Math.PI * (sun.azimuth - 0.5);
    sunSphere.position.x = distance * Math.cos(phi);
    sunSphere.position.y = distance * Math.sin(phi) * Math.sin(theta);
    sunSphere.position.z = distance * Math.sin(phi) * Math.cos(theta);
    sunSphere.visible = sun.visible;
    sky.uniforms.sunPosition.value.copy(sunSphere.position);
    this.scene.add(sunSphere);
  };

  return Sky;

})();
