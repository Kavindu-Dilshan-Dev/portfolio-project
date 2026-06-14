/* ===========================================================
   Bug Hunt — a 3D QA mini-game built with Three.js.
   Click red "bugs" to fix them; avoid green "passing tests".
   =========================================================== */
import * as THREE from 'three';

const canvas = document.getElementById('gameCanvas');

/* ---- DOM ---- */
const el = {
  hud: document.getElementById('hud'),
  legend: document.getElementById('legend'),
  fixed: document.getElementById('hudFixed'),
  score: document.getElementById('hudScore'),
  time: document.getElementById('hudTime'),
  flash: document.getElementById('flash'),
  startOverlay: document.getElementById('startOverlay'),
  endOverlay: document.getElementById('endOverlay'),
  startBtn: document.getElementById('startBtn'),
  againBtn: document.getElementById('againBtn'),
  endRank: document.getElementById('endRank'),
  endFixed: document.getElementById('endFixed'),
  endScore: document.getElementById('endScore'),
  endAcc: document.getElementById('endAcc'),
  endEmoji: document.getElementById('endEmoji'),
  endMsg: document.getElementById('endMsg'),
};

/* ---- Tunables ---- */
const ROUND_SECONDS = 30;
const POP_TARGET = 9;          // objects on screen
const TEST_RATIO = 0.34;       // share that are "passing tests" (distractors)
const BOUNDS = { x: 7.5, y: 4.2, z: 3 };

/* ---- State ---- */
let scene, camera, renderer, raycaster, pointer, starfield;
let objects = [];              // { mesh, type, vel, spin, bobPhase, popping, popT }
let running = false;
let score = 0, fixed = 0, clicksTotal = 0, clicksGood = 0;
let timeLeft = ROUND_SECONDS;
let timerId = null, rafId = null, lastT = 0;

/* ---- Init ---- */
function init() {
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05070f, 0.045);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 12;

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const key = new THREE.PointLight(0xffffff, 1.1, 60); key.position.set(6, 8, 10); scene.add(key);
  const rim = new THREE.PointLight(0x7c5cff, 0.8, 60); rim.position.set(-8, -4, 4); scene.add(rim);

  buildStarfield();

  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();

  window.addEventListener('resize', onResize);
  canvas.addEventListener('pointerdown', onPointerDown);

  loop(0);
}

function buildStarfield() {
  const n = 700;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 40;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 26;
    pos[i * 3 + 2] = -6 - Math.random() * 18;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({ color: 0x6f86b8, size: 0.06, transparent: true, opacity: 0.6 });
  starfield = new THREE.Points(g, m);
  scene.add(starfield);
}

/* ---- Object factory ---- */
function makeBug() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.62, 0),
    new THREE.MeshStandardMaterial({ color: 0xff3b54, emissive: 0xff2d44, emissiveIntensity: 0.55, roughness: 0.35, metalness: 0.2 })
  );
  group.add(body);
  // little antennae / legs as thin lines for character
  const spikeMat = new THREE.MeshStandardMaterial({ color: 0xff8a98, emissive: 0x551018 });
  for (let i = 0; i < 4; i++) {
    const leg = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.5, 6), spikeMat);
    const a = (i / 4) * Math.PI * 2;
    leg.position.set(Math.cos(a) * 0.6, Math.sin(a) * 0.6, 0);
    leg.lookAt(group.position);
    group.add(leg);
  }
  group.userData.hit = body; // raycast target
  return group;
}

function makeTest() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 24, 24),
    new THREE.MeshStandardMaterial({ color: 0x22d37f, emissive: 0x0f8f55, emissiveIntensity: 0.4, roughness: 0.3, metalness: 0.25 })
  );
  group.add(body);
  // a "check" ring to read as a passing test
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.78, 0.05, 8, 32),
    new THREE.MeshStandardMaterial({ color: 0x34e0a1, emissive: 0x1c9c6e })
  );
  group.add(ring);
  group.userData.hit = body;
  return group;
}

function spawnOne(forceType) {
  const isTest = forceType ? forceType === 'test' : Math.random() < TEST_RATIO;
  const mesh = isTest ? makeTest() : makeBug();
  mesh.position.set(
    (Math.random() - 0.5) * BOUNDS.x * 2,
    (Math.random() - 0.5) * BOUNDS.y * 2,
    (Math.random() - 0.5) * BOUNDS.z * 2
  );
  const s = 0.0; mesh.scale.set(s, s, s); // grow in
  scene.add(mesh);
  objects.push({
    mesh,
    type: isTest ? 'test' : 'bug',
    vel: new THREE.Vector3((Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.04, (Math.random() - 0.5) * 0.02),
    spin: (Math.random() - 0.5) * 0.04,
    bobPhase: Math.random() * Math.PI * 2,
    grow: true,
    popping: false,
    popT: 0,
  });
}

function maintainPopulation() {
  let bugs = objects.filter((o) => o.type === 'bug' && !o.popping).length;
  while (objects.filter((o) => !o.popping).length < POP_TARGET) {
    // guarantee there are always bugs to hit
    spawnOne(bugs < 4 ? 'bug' : undefined);
    bugs = objects.filter((o) => o.type === 'bug' && !o.popping).length;
  }
}

/* ---- Interaction ---- */
function onPointerDown(e) {
  if (!running) return;
  const r = canvas.getBoundingClientRect();
  pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  const targets = objects.filter((o) => !o.popping).map((o) => o.mesh.userData.hit);
  const hits = raycaster.intersectObjects(targets, false);
  clicksTotal++;

  if (hits.length === 0) { return; } // miss — no penalty, keep it friendly

  const hitMesh = hits[0].object;
  const obj = objects.find((o) => o.mesh.userData.hit === hitMesh);
  if (!obj || obj.popping) return;

  if (obj.type === 'bug') {
    clicksGood++;
    fixed++;
    score += 10;
    obj.popping = true; obj.popT = 0;
    flash('good');
  } else {
    score = Math.max(0, score - 5);
    obj.popping = true; obj.popT = 0;
    flash('bad');
  }
  updateHud();
}

function flash(kind) {
  el.flash.className = 'game-flash show ' + kind;
  setTimeout(() => { el.flash.className = 'game-flash'; }, 180);
}

/* ---- Loop ---- */
function loop(t) {
  rafId = requestAnimationFrame(loop);
  const dt = Math.min((t - lastT) / 16.67, 3) || 1;
  lastT = t;

  if (starfield) starfield.rotation.z += 0.0004 * dt;

  for (let i = objects.length - 1; i >= 0; i--) {
    const o = objects[i];
    const m = o.mesh;

    if (o.grow) {
      const s = Math.min(1, m.scale.x + 0.08 * dt);
      m.scale.set(s, s, s);
      if (s >= 1) o.grow = false;
    }

    if (o.popping) {
      o.popT += 0.12 * dt;
      const s = Math.max(0, 1 - o.popT);
      m.scale.set(s, s, s);
      m.rotation.y += 0.3 * dt;
      if (s <= 0.001) { scene.remove(m); objects.splice(i, 1); }
      continue;
    }

    // drift + bounce within bounds
    m.position.addScaledVector(o.vel, dt);
    ['x', 'y', 'z'].forEach((ax) => {
      if (Math.abs(m.position[ax]) > BOUNDS[ax]) {
        m.position[ax] = Math.sign(m.position[ax]) * BOUNDS[ax];
        o.vel[ax] *= -1;
      }
    });
    o.bobPhase += 0.03 * dt;
    m.position.y += Math.sin(o.bobPhase) * 0.004 * dt;
    m.rotation.x += o.spin * dt;
    m.rotation.y += o.spin * 1.3 * dt;
  }

  if (running) maintainPopulation();
  renderer.render(scene, camera);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/* ---- Round control ---- */
function updateHud() {
  el.fixed.textContent = fixed;
  el.score.textContent = score;
  el.time.textContent = timeLeft;
}

function clearObjects() {
  objects.forEach((o) => scene.remove(o.mesh));
  objects = [];
}

function startGame() {
  clearObjects();
  score = 0; fixed = 0; clicksTotal = 0; clicksGood = 0; timeLeft = ROUND_SECONDS;
  updateHud();
  el.startOverlay.classList.add('hidden');
  el.endOverlay.classList.add('hidden');
  el.hud.setAttribute('aria-hidden', 'false');
  el.legend.setAttribute('aria-hidden', 'false');
  el.hud.classList.add('show');
  el.legend.classList.add('show');
  running = true;
  maintainPopulation();

  clearInterval(timerId);
  timerId = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) { timeLeft = 0; updateHud(); endGame(); }
    else updateHud();
  }, 1000);
}

function rankFor(s) {
  if (s >= 200) return { rank: 'QA Lead · Bug Slayer', emoji: '👑', msg: 'Elite reflexes. You\'d catch regressions in your sleep.' };
  if (s >= 140) return { rank: 'Senior SDET', emoji: '🥇', msg: 'Sharp eye and low false positives — proper automation instinct.' };
  if (s >= 80)  return { rank: 'QA Automation Engineer', emoji: '🥈', msg: 'Solid hunting. A few bugs slipped, but coverage was strong.' };
  if (s >= 30)  return { rank: 'QA Trainee', emoji: '🥉', msg: 'Good start! Watch out for those green passing tests.' };
  return { rank: 'Intern on Day One', emoji: '🌱', msg: 'Everyone starts somewhere — give it another run!' };
}

function endGame() {
  running = false;
  clearInterval(timerId);
  el.hud.classList.remove('show');
  el.legend.classList.remove('show');

  const acc = clicksTotal ? Math.round((clicksGood / clicksTotal) * 100) : 0;
  const r = rankFor(score);
  el.endFixed.textContent = fixed;
  el.endScore.textContent = score;
  el.endAcc.textContent = acc + '%';
  el.endRank.textContent = r.rank;
  el.endEmoji.textContent = r.emoji;
  el.endMsg.textContent = r.msg;
  el.endOverlay.classList.remove('hidden');
}

/* ---- Boot ---- */
try {
  init();
  el.startBtn.addEventListener('click', startGame);
  el.againBtn.addEventListener('click', startGame);
} catch (err) {
  console.warn('Game disabled (WebGL?):', err);
  el.startOverlay.innerHTML =
    '<div class="game-card"><h1>Bug Hunt</h1><p class="game-sub">This mini-game needs WebGL, which isn\'t available in your browser right now.</p><a class="btn btn--primary" href="index.html">← Back to portfolio</a></div>';
}
