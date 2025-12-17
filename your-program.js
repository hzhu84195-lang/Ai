(function () {
  const container = document.getElementById('app');
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#0b1020', 0.025);

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 75);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor('#0b1020', 0.8);
  container.appendChild(renderer.domElement);

  const particleCount = 200;
  const spread = 50;

  const positions = new Float32Array(particleCount * 3);
  const velocities = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  const opacities = new Float32Array(particleCount);
  const lifetimes = new Float32Array(particleCount);
  const ages = new Float32Array(particleCount);

  const geometry = new THREE.BufferGeometry();

  function randomizeParticle(i) {
    positions[i * 3] = THREE.MathUtils.randFloatSpread(spread);
    positions[i * 3 + 1] = THREE.MathUtils.randFloatSpread(spread);
    positions[i * 3 + 2] = THREE.MathUtils.randFloatSpread(spread * 0.5) - 20;

    velocities[i * 3] = THREE.MathUtils.randFloatSpread(1.2);
    velocities[i * 3 + 1] = THREE.MathUtils.randFloatSpread(1.2);
    velocities[i * 3 + 2] = THREE.MathUtils.randFloat(-0.6, -0.2);

    lifetimes[i] = THREE.MathUtils.randFloat(2.5, 5.5);
    ages[i] = 0;
    sizes[i] = THREE.MathUtils.randFloat(4, 10);
    opacities[i] = 0.0;
  }

  for (let i = 0; i < particleCount; i += 1) {
    randomizeParticle(i);
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aOpacity', new THREE.BufferAttribute(opacities, 1));

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uColor: { value: new THREE.Color('#8ad5ff') }
    },
    vertexShader: `
      attribute float aSize;
      attribute float aOpacity;
      varying float vOpacity;
      void main() {
        vOpacity = aOpacity;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      varying float vOpacity;
      void main() {
        vec2 uv = gl_PointCoord - vec2(0.5);
        float falloff = 1.0 - smoothstep(0.25, 0.55, length(uv));
        gl_FragColor = vec4(uColor, vOpacity * falloff);
      }
    `
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  const clock = new THREE.Clock();

  function updateParticles(delta) {
    for (let i = 0; i < particleCount; i += 1) {
      ages[i] += delta;
      if (ages[i] >= lifetimes[i]) {
        randomizeParticle(i);
      }

      const t = ages[i] / lifetimes[i];
      const ease = THREE.MathUtils.smoothstep(t, 0, 1);
      const wobble = Math.sin(t * Math.PI * 2) * 0.5 + 0.5;

      positions[i * 3] += velocities[i * 3] * delta * 6;
      positions[i * 3 + 1] += velocities[i * 3 + 1] * delta * 6;
      positions[i * 3 + 2] += velocities[i * 3 + 2] * delta * 6;

      sizes[i] = THREE.MathUtils.lerp(6, 14, wobble) * (1.0 - ease * 0.4);
      opacities[i] = Math.sin(t * Math.PI) * 0.8 + 0.2;
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.aSize.needsUpdate = true;
    geometry.attributes.aOpacity.needsUpdate = true;
  }

  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    updateParticles(delta);
    scene.rotation.y += delta * 0.08;
    renderer.render(scene, camera);
  }

  function onResize() {
    const { innerWidth, innerHeight } = window;
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  }

  window.addEventListener('resize', onResize);
  animate();
})();
