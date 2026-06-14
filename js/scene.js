/* ===========================================================
   3D animated hero background — Three.js (ES module via CDN)
   A drifting particle field + floating wireframe solids with
   subtle mouse parallax. Degrades gracefully and respects
   prefers-reduced-motion.
   =========================================================== */
import * as THREE from 'three';

const canvas = document.getElementById('bg');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let renderer, scene, camera, particles, shapes = [];
let mouseX = 0, mouseY = 0;
let targetX = 0, targetY = 0;
let frame;

function init() {
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x070b16, 0.06);

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 9;

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  buildParticles();
  buildShapes();
  buildLights();
  applySceneTheme(document.documentElement.getAttribute('data-theme') || 'dark');

  window.addEventListener('resize', onResize);
  window.addEventListener('pointermove', onPointerMove);

  animate();
}

/* ---- Recolour the scene for light / dark theme (called from main.js) ---- */
function applySceneTheme(t) {
  if (!scene) return;
  if (t === 'light') {
    scene.fog.color.set(0xdce6f5);
    if (particles) {
      particles.material.blending = THREE.NormalBlending;
      particles.material.opacity = 0.55;
      particles.material.needsUpdate = true;
    }
    shapes.forEach((m) => { m.material.opacity = 0.5; });
  } else {
    scene.fog.color.set(0x070b16);
    if (particles) {
      particles.material.blending = THREE.AdditiveBlending;
      particles.material.opacity = 0.85;
      particles.material.needsUpdate = true;
    }
    shapes.forEach((m) => { m.material.opacity = 0.35; });
  }
}
window.__updateSceneTheme = applySceneTheme;

/* ---- Particle cloud ---- */
function buildParticles() {
  const count = window.innerWidth < 768 ? 1400 : 2600;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  const palette = [
    new THREE.Color(0x38bdf8), // cyan
    new THREE.Color(0x7c5cff), // violet
    new THREE.Color(0x22d3a7), // teal
  ];

  for (let i = 0; i < count; i++) {
    // distribute in a soft spherical shell
    const r = 6 + Math.random() * 12;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    const c = palette[Math.floor(Math.random() * palette.length)];
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.05,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  particles = new THREE.Points(geo, mat);
  scene.add(particles);
}

/* ---- Floating wireframe solids ---- */
function buildShapes() {
  const defs = [
    { geo: new THREE.IcosahedronGeometry(1.6, 0), color: 0x38bdf8, pos: [-5, 2, -2] },
    { geo: new THREE.TorusGeometry(1.1, 0.35, 12, 28), color: 0x7c5cff, pos: [5.5, -1.5, -1] },
    { geo: new THREE.OctahedronGeometry(1.2, 0), color: 0x22d3a7, pos: [3.5, 3, -4] },
    { geo: new THREE.DodecahedronGeometry(1.0, 0), color: 0x38bdf8, pos: [-4.5, -2.5, -3] },
  ];

  defs.forEach((d) => {
    const mat = new THREE.MeshBasicMaterial({ color: d.color, wireframe: true, transparent: true, opacity: 0.35 });
    const mesh = new THREE.Mesh(d.geo, mat);
    mesh.position.set(...d.pos);
    mesh.userData.spin = (Math.random() - 0.5) * 0.004;
    mesh.userData.float = Math.random() * Math.PI * 2;
    scene.add(mesh);
    shapes.push(mesh);
  });
}

function buildLights() {
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const p1 = new THREE.PointLight(0x38bdf8, 1.2, 50); p1.position.set(8, 6, 6); scene.add(p1);
  const p2 = new THREE.PointLight(0x7c5cff, 1.0, 50); p2.position.set(-8, -4, 4); scene.add(p2);
}

/* ---- Interaction & resize ---- */
function onPointerMove(e) {
  mouseX = (e.clientX / window.innerWidth) * 2 - 1;
  mouseY = (e.clientY / window.innerHeight) * 2 - 1;
}
function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/* ---- Render loop ---- */
let t = 0;
function animate() {
  frame = requestAnimationFrame(animate);
  t += 0.005;

  // ease camera toward mouse for parallax
  targetX += (mouseX * 0.6 - targetX) * 0.04;
  targetY += (mouseY * 0.4 - targetY) * 0.04;
  camera.position.x = targetX;
  camera.position.y = -targetY;
  camera.lookAt(scene.position);

  if (particles) {
    particles.rotation.y += 0.0006;
    particles.rotation.x += 0.0002;
  }
  shapes.forEach((m, i) => {
    m.rotation.x += m.userData.spin;
    m.rotation.y += m.userData.spin * 1.3;
    m.position.y += Math.sin(t + m.userData.float + i) * 0.0025;
  });

  renderer.render(scene, camera);
}

/* ---- Boot (skip heavy animation if reduced motion / no WebGL) ---- */
try {
  init();
  if (reduceMotion) {
    // render a single static frame, then stop the loop
    cancelAnimationFrame(frame);
    renderer.render(scene, camera);
  }
} catch (err) {
  // WebGL unavailable — overlay gradient still provides a nice backdrop
  console.warn('3D background disabled:', err);
}
