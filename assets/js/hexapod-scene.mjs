import * as THREE from '../vendor/three/build/three.module.min.js';
import { OrbitControls } from '../vendor/three/jsm/controls/OrbitControls.js';
import { GLTFLoader } from '../vendor/three/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from '../vendor/three/jsm/loaders/DRACOLoader.js';

const DEFAULT_CAMERA_POS = new THREE.Vector3(0.38, 0.28, 0.44);
const DEFAULT_TARGET = new THREE.Vector3(0, 0.025, 0);

function createFloorTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#15130e';
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = 'rgba(226, 169, 43, 0.22)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, size - 2, size - 2);

  ctx.strokeStyle = 'rgba(242, 239, 230, 0.06)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    const p = (size / 4) * i;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, size);
    ctx.moveTo(0, p);
    ctx.lineTo(size, p);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makePlateGeometry(width, length, thickness, chamfer = 0.036) {
  const hw = width / 2;
  const hl = length / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-hw + chamfer, -hl);
  shape.lineTo(hw - chamfer, -hl);
  shape.lineTo(hw, -hl + chamfer);
  shape.lineTo(hw, hl - chamfer);
  shape.lineTo(hw - chamfer, hl);
  shape.lineTo(-hw + chamfer, hl);
  shape.lineTo(-hw, hl - chamfer);
  shape.lineTo(-hw, -hl + chamfer);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false
  });
  geo.rotateX(Math.PI / 2);
  geo.translate(0, thickness / 2, 0);
  return geo;
}

/**
 * Build a procedural 18-DOF Hexaka V3 model matching the exact HexakaRoot rig contract.
 */
function buildProceduralHexapod(kinematics) {
  const root = new THREE.Group();
  root.name = 'HexakaRoot';

  const bodyChassis = new THREE.Group();
  bodyChassis.name = 'BodyChassis';
  root.add(bodyChassis);

  const matChassis = new THREE.MeshStandardMaterial({ color: 0x2c2923, roughness: 0.55, metalness: 0.28 });
  const matCover = new THREE.MeshStandardMaterial({
    color: 0x353027,
    roughness: 0.45,
    metalness: 0.28,
    transparent: true,
    opacity: 1
  });
  const matCoverWire = new THREE.MeshBasicMaterial({
    color: 0xe2a92b,
    wireframe: true,
    transparent: true,
    opacity: 0
  });
  const matServo = new THREE.MeshStandardMaterial({ color: 0x2e2b26, roughness: 0.48, metalness: 0.25 });
  const matBracket = new THREE.MeshStandardMaterial({ color: 0x574f42, roughness: 0.48, metalness: 0.38 });
  const matAmber = new THREE.MeshStandardMaterial({ color: 0xe2a92b, roughness: 0.35, metalness: 0.45 });
  const matPcb = new THREE.MeshStandardMaterial({ color: 0x238258, roughness: 0.46, metalness: 0.15 });
  const matHeatsink = new THREE.MeshStandardMaterial({ color: 0xaab4be, roughness: 0.32, metalness: 0.72 });
  const matUbec = new THREE.MeshStandardMaterial({ color: 0x2e689e, roughness: 0.45, metalness: 0.2 });
  const matFoot = new THREE.MeshStandardMaterial({ color: 0x33302b, roughness: 0.8, metalness: 0.1 });

  // Lower chassis (bottom plate, leg mount pods)
  const bodyLower = new THREE.Group();
  bodyLower.name = 'Body_Lower';
  const plateGeo = makePlateGeometry(0.202, 0.262, 0.003, 0.044);
  const bottomPlate = new THREE.Mesh(plateGeo, matChassis);
  bottomPlate.position.y = -0.017;
  bodyLower.add(bottomPlate);


  const podGeo = new THREE.BoxGeometry(0.038, 0.026, 0.038);
  kinematics.DEFAULT_LEGS.forEach(leg => {
    const pod = new THREE.Mesh(podGeo, matBracket);
    pod.position.set(leg.mount.x, leg.mount.y + 0.004, leg.mount.z);
    pod.rotation.y = leg.baseYaw;
    bodyLower.add(pod);
  });
  bodyChassis.add(bodyLower);

  // Internal electronics (exposed during Exploded/X-Ray mode)
  const bodyInternals = new THREE.Group();
  bodyInternals.name = 'Body_Internals';

  const rpiGroup = new THREE.Group();
  rpiGroup.name = 'RPi5';
  const rpiBoard = new THREE.Mesh(new THREE.BoxGeometry(0.056, 0.003, 0.085), matPcb);
  rpiBoard.position.set(0, 0.003, 0.014);
  const rpiSink = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.011, 0.040), matHeatsink);
  rpiSink.position.set(-0.003, 0.010, 0.010);
  const rpiPorts = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.013, 0.016), matHeatsink);
  rpiPorts.position.set(0, 0.010, 0.049);
  const rpiGpio = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.008, 0.051), matAmber);
  rpiGpio.position.set(0.024, 0.008, 0.010);
  rpiGroup.add(rpiBoard, rpiSink, rpiPorts, rpiGpio);

  const ubec = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.012, 0.044), matUbec);
  ubec.name = 'UBEC_15A';
  ubec.position.set(-0.054, -0.005, -0.032);

  const u2d2 = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.012, 0.046), matBracket);
  u2d2.name = 'U2D2';
  u2d2.position.set(0.054, 0.002, 0.022);

  bodyInternals.add(rpiGroup, ubec, u2d2);
  bodyChassis.add(bodyInternals);

  // Removable / semi-transparent top cover + Logitech C270 camera
  const bodyCover = new THREE.Group();
  bodyCover.name = 'Body_Cover';

  const topPlate = new THREE.Mesh(plateGeo, matCover);
  topPlate.name = 'Top_Plate';
  topPlate.position.y = 0.018;
  const topWire = new THREE.Mesh(plateGeo, matCoverWire);
  topWire.position.y = 0.018;

  const shellDome = new THREE.Mesh(makePlateGeometry(0.140, 0.195, 0.014, 0.026), matCover);
  shellDome.position.y = 0.026;
  const shellStripe = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.003, 0.140), matAmber);
  shellStripe.position.set(0, 0.034, -0.008);

  const camGroup = new THREE.Group();
  camGroup.name = 'Camera_C270';
  camGroup.position.set(0, 0.002, 0.132);
  const camBody = new THREE.Mesh(new THREE.BoxGeometry(0.070, 0.024, 0.022), matServo);
  const camLens = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.008, 14), matAmber);
  camLens.rotation.x = Math.PI / 2;
  camLens.position.set(0, 0, 0.011);
  camGroup.add(camBody, camLens);

  bodyCover.add(topPlate, topWire, shellDome, shellStripe, camGroup);
  bodyChassis.add(bodyCover);

  // 6 x 3-DOF legs extending along local +X in zero-angle pose
  const legsGroup = new THREE.Group();
  legsGroup.name = 'Legs';
  bodyChassis.add(legsGroup);

  const seg = kinematics.DEFAULT_SEGMENTS;
  const servoGeo = new THREE.BoxGeometry(0.032, 0.028, 0.044);
  const coxaBarGeo = new THREE.BoxGeometry(seg.coxa, 0.014, 0.020);
  const femurBarGeo = new THREE.BoxGeometry(seg.femur, 0.016, 0.022);
  const tibiaBarGeo = new THREE.CylinderGeometry(0.007, 0.005, seg.tibia, 10);
  tibiaBarGeo.rotateZ(Math.PI / 2);
  const footGeo = new THREE.SphereGeometry(0.008, 10, 8);
  const hornGeo = new THREE.CylinderGeometry(0.010, 0.010, 0.032, 10);

  kinematics.DEFAULT_LEGS.forEach(def => {
    const legNode = new THREE.Group();
    legNode.name = `Leg_${def.id}`;
    legNode.position.set(def.mount.x, def.mount.y, def.mount.z);
    legNode.rotation.y = def.baseYaw;

    const coxaNode = new THREE.Group();
    coxaNode.name = `Coxa_${def.id}`;
    const coxaServo = new THREE.Mesh(servoGeo, matServo);
    const coxaHorn = new THREE.Mesh(hornGeo, matAmber);
    const coxaLink = new THREE.Mesh(coxaBarGeo, matBracket);
    coxaLink.position.x = seg.coxa * 0.5;
    coxaNode.add(coxaServo, coxaHorn, coxaLink);

    const femurNode = new THREE.Group();
    femurNode.name = `Femur_${def.id}`;
    femurNode.position.x = seg.coxa;
    const femurServo = new THREE.Mesh(servoGeo, matServo);
    femurServo.rotation.x = Math.PI / 2;
    const femurLink = new THREE.Mesh(femurBarGeo, matBracket);
    femurLink.position.x = seg.femur * 0.5;
    const femurAccent = new THREE.Mesh(new THREE.BoxGeometry(seg.femur * 0.65, 0.004, 0.024), matAmber);
    femurAccent.position.x = seg.femur * 0.5;
    femurNode.add(femurServo, femurLink, femurAccent);

    const tibiaNode = new THREE.Group();
    tibiaNode.name = `Tibia_${def.id}`;
    tibiaNode.position.x = seg.femur;
    const tibiaServo = new THREE.Mesh(servoGeo, matServo);
    tibiaServo.rotation.x = Math.PI / 2;
    const tibiaLink = new THREE.Mesh(tibiaBarGeo, matBracket);
    tibiaLink.position.x = seg.tibia * 0.5;
    tibiaNode.add(tibiaServo, tibiaLink);

    const footNode = new THREE.Group();
    footNode.name = `Foot_${def.id}`;
    footNode.position.x = seg.tibia;
    footNode.add(new THREE.Mesh(footGeo, matFoot));

    tibiaNode.add(footNode);
    femurNode.add(tibiaNode);
    coxaNode.add(femurNode);
    legNode.add(coxaNode);
    legsGroup.add(legNode);
  });

  return {
    root,
    coverMaterials: [matCover],
    coverWireMaterials: [matCoverWire]
  };
}

function extractRig(root, kinematics) {
  const bodyChassis = root.getObjectByName('BodyChassis') || root;
  const bodyCover = root.getObjectByName('Body_Cover');
  const legNodes = [];
  const legDefs = [];

  for (let i = 0; i < 6; i++) {
    const legRoot = root.getObjectByName(`Leg_${i}`);
    const coxa = root.getObjectByName(`Coxa_${i}`);
    const femur = root.getObjectByName(`Femur_${i}`);
    const tibia = root.getObjectByName(`Tibia_${i}`);
    const foot = root.getObjectByName(`Foot_${i}`);
    if (!legRoot || !coxa || !femur || !tibia) continue;

    legNodes.push({ legRoot, coxa, femur, tibia, foot });
    const baseDef = kinematics.DEFAULT_LEGS[i];
    // Derive yaw from local +X axis vector because Euler XYZ can flip at +-180 deg.
    const xAxis = new THREE.Vector3(1, 0, 0).applyQuaternion(legRoot.quaternion);
    const baseYaw = Math.atan2(-xAxis.z, xAxis.x);
    legDefs.push({
      id: i,
      side: baseDef.side,
      role: baseDef.role,
      mount: { x: legRoot.position.x, y: legRoot.position.y, z: legRoot.position.z },
      baseYaw,
      tripodPhase: baseDef.tripodPhase
    });
  }

  let segments = kinematics.DEFAULT_SEGMENTS;
  if (legNodes[0]) {
    const n = legNodes[0];
    const coxaLen = n.femur.position.length() || kinematics.DEFAULT_SEGMENTS.coxa;
    const femurLen = n.tibia.position.length() || kinematics.DEFAULT_SEGMENTS.femur;
    const tibiaLen = n.foot ? n.foot.position.length() : kinematics.DEFAULT_SEGMENTS.tibia;
    segments = {
      coxa: coxaLen,
      femur: femurLen,
      tibia: tibiaLen || kinematics.DEFAULT_SEGMENTS.tibia,
      neutralReach: coxaLen + femurLen * 0.95
    };
  }

  return { bodyChassis, bodyCover, legNodes, legDefs, segments };
}

export async function createHexapodScene({
  container,
  kinematics,
  // Resolved from this module so the scene also works on nested pages
  // such as /projects/hexaka/. Paths inside the config are site-root relative.
  configUrl = new URL('../models/model-config.json', import.meta.url).href,
  reducedMotion = false,
  onReady,
  onError
}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch {
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    } catch (err) {
      onError?.(err);
      return null;
    }
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.02, 10);
  camera.position.copy(DEFAULT_CAMERA_POS);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 0.28;
  controls.maxDistance = 0.95;
  controls.minPolarAngle = 0.22;
  controls.maxPolarAngle = Math.PI * 0.48;
  controls.target.copy(DEFAULT_TARGET);
  controls.update();

  // Studio lighting tuned to dark slate + warm amber palette with crisp leg fill
  const hemi = new THREE.HemisphereLight(0xf2efe6, 0x2a251b, 1.2);
  const keyLight = new THREE.DirectionalLight(0xfff6e3, 2.0);
  keyLight.position.set(0.6, 1.1, 0.7);
  const fillLight = new THREE.DirectionalLight(0xf2efe6, 0.85);
  fillLight.position.set(-0.4, 0.5, 0.9);
  const rimLight = new THREE.DirectionalLight(0xe2a92b, 1.0);
  rimLight.position.set(-0.7, 0.45, -0.6);
  scene.add(hemi, keyLight, fillLight, rimLight);

  // Tilting floor platform with inner spin plane so yaw turning stays aligned to terrain slope
  const floorGroup = new THREE.Group();
  const floorSpinGroup = new THREE.Group();
  const floorTex = createFloorTexture();
  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTex,
    roughness: 0.9,
    metalness: 0.05
  });
  const floorMesh = new THREE.Mesh(new THREE.CircleGeometry(0.46, 48), floorMat);
  floorMesh.rotation.x = -Math.PI / 2;
  floorSpinGroup.add(floorMesh);

  const ringGeo = new THREE.RingGeometry(0.455, 0.462, 48);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMesh = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xe2a92b, transparent: true, opacity: 0.35 }));
  ringMesh.position.y = 0.001;
  floorSpinGroup.add(ringMesh);
  floorGroup.add(floorSpinGroup);

  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x050403, transparent: true, opacity: 0.45 });
  const contactShadow = new THREE.Mesh(new THREE.CircleGeometry(0.16, 28), shadowMat);
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = 0.002;
  floorGroup.add(contactShadow);
  scene.add(floorGroup);

  // Load config first to avoid 404 console errors when glbUrl is null
  let modelSource = 'procedural';
  let loadedModel = null;
  try {
    const siteRoot = new URL('../../', import.meta.url);
    const res = await fetch(configUrl);
    if (res.ok) {
      const cfg = await res.json();
      if (cfg?.glbUrl) {
        const loader = new GLTFLoader();
        if (cfg.dracoPath) {
          const draco = new DRACOLoader();
          draco.setDecoderPath(new URL(cfg.dracoPath, siteRoot).href);
          loader.setDRACOLoader(draco);
        }
        const gltf = await loader.loadAsync(new URL(cfg.glbUrl, siteRoot).href);
        // The shipped GLB still contains amber chassis standoffs; they read as
        // stray gold pillars, so drop them before the model is added.
        const standoffs = [];
        gltf.scene.traverse(obj => { if (/^Standoff_\d+$/.test(obj.name)) standoffs.push(obj); });
        standoffs.forEach(obj => obj.removeFromParent());
        loadedModel = { root: gltf.scene, coverMaterials: [], coverWireMaterials: [] };
        const glbCover = gltf.scene.getObjectByName('Body_Cover');
        glbCover?.traverse(obj => {
          if (obj.isMesh && obj.material) {
            obj.material = obj.material.clone();
            obj.material.transparent = true;
            loadedModel.coverMaterials.push(obj.material);
          }
        });
        modelSource = 'glb';
      }
    }
  } catch {
    // Fall back cleanly to the procedural 18-DOF model if config or GLB cannot be loaded.
  }

  const asset = loadedModel || buildProceduralHexapod(kinematics);
  scene.add(asset.root);
  const rig = extractRig(asset.root, kinematics);

  const state = {
    vx: 0,
    omega: 0,
    vxCurr: 0,
    omegaCurr: 0,
    slopeDeg: 0,
    exploded: false,
    phase: 0,
    explodeBlend: 0,
    slopeBlend: 0,
    bodyHeightCurr: null,
    bodyPitchCurr: 0,
    bodyRollCurr: 0,
    jointAngles: rig.legNodes.map(() => null),
    jointsSettled: true,
    active: true,
    visible: true,
    orbiting: false,
    reducedMotion: Boolean(reducedMotion),
    floorOffsetU: 0,
    floorOffsetV: 0
  };

  let rafId = null;
  let lastTime = 0;
  let resizeObserver = null;

  function resize() {
    const w = container.clientWidth || 400;
    const h = container.clientHeight || 300;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function dampFactor(rate, dt) {
    return state.reducedMotion ? 1 : 1 - Math.exp(-rate * dt);
  }

  function applyPose(dt, snap = false) {
    const velAlpha = snap ? 1 : dampFactor(5.8, dt);
    const uiAlpha = snap ? 1 : dampFactor(8.5, dt);
    const servoAlpha = snap ? 1 : dampFactor(18, dt);
    const bodyAlpha = snap ? 1 : dampFactor(11, dt);

    state.vxCurr += (state.vx - state.vxCurr) * velAlpha;
    state.omegaCurr += (state.omega - state.omegaCurr) * velAlpha;
    if (Math.abs(state.vx) < 0.001 && Math.abs(state.vxCurr) < 0.003) state.vxCurr = 0;
    if (Math.abs(state.omega) < 0.001 && Math.abs(state.omegaCurr) < 0.003) state.omegaCurr = 0;

    state.slopeBlend += (state.slopeDeg - state.slopeBlend) * uiAlpha;
    state.explodeBlend += ((state.exploded ? 1 : 0) - state.explodeBlend) * uiAlpha;

    // Keep gait phase advancing continuously without resetting across direction changes or deceleration.
    const currSpeed = Math.hypot(state.vxCurr, state.omegaCurr);
    if (currSpeed > 0.002 && !state.reducedMotion) {
      const cadence = 4.6 + 2.2 * Math.min(1, currSpeed);
      state.phase = (state.phase + dt * cadence) % (Math.PI * 2);
      state.floorOffsetV -= state.vxCurr * dt * 0.42;
      floorSpinGroup.rotation.y += state.omegaCurr * dt * 0.55;
      if (floorTex) {
        floorTex.offset.set(state.floorOffsetU, state.floorOffsetV);
      }
    }

    const pose = kinematics.computePose({
      vx: state.vxCurr,
      omega: state.omegaCurr,
      slopeDeg: state.slopeBlend,
      phase: state.phase,
      legs: rig.legDefs,
      segments: rig.segments
    });

    if (state.bodyHeightCurr === null || snap) {
      state.bodyHeightCurr = pose.bodyHeight;
      state.bodyPitchCurr = pose.bodyPitchRad;
      state.bodyRollCurr = pose.bodyRollRad;
    } else {
      state.bodyHeightCurr += (pose.bodyHeight - state.bodyHeightCurr) * bodyAlpha;
      state.bodyPitchCurr += (pose.bodyPitchRad - state.bodyPitchCurr) * bodyAlpha;
      state.bodyRollCurr += (pose.bodyRollRad - state.bodyRollCurr) * bodyAlpha;
    }

    rig.bodyChassis.position.y = state.bodyHeightCurr;
    rig.bodyChassis.rotation.x = state.bodyPitchCurr;
    rig.bodyChassis.rotation.z = state.bodyRollCurr;
    floorGroup.rotation.x = pose.floorPitchRad;

    if (rig.bodyCover) {
      rig.bodyCover.position.y = state.explodeBlend * 0.066;
    }
    asset.coverMaterials.forEach(mat => {
      mat.opacity = 1 - state.explodeBlend * 0.72;
    });
    asset.coverWireMaterials.forEach(mat => {
      mat.opacity = state.explodeBlend * 0.35;
    });

    let maxDelta = Math.abs(pose.bodyHeight - state.bodyHeightCurr);
    pose.legs.forEach((legPose, idx) => {
      const nodes = rig.legNodes[idx];
      if (!nodes) return;
      const target = legPose.angles;
      let curr = state.jointAngles[idx];
      if (!curr || snap) {
        curr = { coxa: target.coxa, femur: target.femur, tibia: target.tibia };
        state.jointAngles[idx] = curr;
      } else {
        const dc = target.coxa - curr.coxa;
        const df = target.femur - curr.femur;
        const dtb = target.tibia - curr.tibia;
        curr.coxa += dc * servoAlpha;
        curr.femur += df * servoAlpha;
        curr.tibia += dtb * servoAlpha;
        maxDelta = Math.max(maxDelta, Math.abs(dc), Math.abs(df), Math.abs(dtb));
      }
      nodes.coxa.rotation.y = curr.coxa;
      nodes.femur.rotation.z = curr.femur;
      nodes.tibia.rotation.z = curr.tibia;
    });

    state.jointsSettled = maxDelta < 0.0015;
    return pose;
  }

  function needsAnimation() {
    if (!state.active || !state.visible || document.hidden) return false;
    const moving =
      (Math.hypot(state.vx, state.omega) > 0.005 || Math.hypot(state.vxCurr, state.omegaCurr) > 0.002) &&
      !state.reducedMotion;
    const transitioning =
      Math.abs(state.slopeDeg - state.slopeBlend) > 0.02 ||
      Math.abs((state.exploded ? 1 : 0) - state.explodeBlend) > 0.01 ||
      !state.jointsSettled;
    return moving || transitioning || state.orbiting;
  }

  function renderFrame(now = performance.now()) {
    rafId = null;
    const dt = lastTime ? Math.min(0.05, (now - lastTime) / 1000) : 0.016;
    lastTime = now;

    applyPose(dt);
    const orbitChanged = controls.update();
    renderer.render(scene, camera);

    if (needsAnimation() || orbitChanged) {
      scheduleTick();
    } else {
      lastTime = 0;
    }
  }

  function scheduleTick() {
    if (rafId !== null || !state.active || !state.visible || document.hidden) return;
    rafId = requestAnimationFrame(renderFrame);
  }

  controls.addEventListener('start', () => {
    state.orbiting = true;
    scheduleTick();
  });
  controls.addEventListener('end', () => {
    state.orbiting = false;
    scheduleTick();
  });
  controls.addEventListener('change', () => {
    if (state.active && state.visible) scheduleTick();
  });

  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      resize();
      renderer.render(scene, camera);
    });
    resizeObserver.observe(container);
  }

  resize();
  applyPose(1, true);
  renderer.render(scene, camera);
  onReady?.({ modelSource });

  function wakeMotion() {
    if (state.reducedMotion) {
      applyPose(0, true);
      renderer.render(scene, camera);
      return;
    }
    scheduleTick();
  }

  return {
    setMotion(vx, omega) {
      state.vx = vx;
      state.omega = omega;
      if (state.reducedMotion && (vx !== 0 || omega !== 0)) {
        state.phase = (state.phase + Math.PI * 0.65) % (Math.PI * 2);
      }
      wakeMotion();
    },
    setSlope(deg) {
      state.slopeDeg = deg;
      wakeMotion();
    },
    setExploded(exploded) {
      state.exploded = Boolean(exploded);
      wakeMotion();
    },
    resetCamera() {
      camera.position.copy(DEFAULT_CAMERA_POS);
      controls.target.copy(DEFAULT_TARGET);
      controls.update();
      renderer.render(scene, camera);
    },
    setActive(active) {
      state.active = Boolean(active);
      if (state.active) {
        resize();
        scheduleTick();
      } else if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
        lastTime = 0;
      }
    },
    setVisible(visible) {
      state.visible = Boolean(visible);
      if (state.visible) scheduleTick();
      else if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
        lastTime = 0;
      }
    },
    setReducedMotion(reduced) {
      state.reducedMotion = Boolean(reduced);
      wakeMotion();
    },
    dispose() {
      if (rafId !== null) cancelAnimationFrame(rafId);
      resizeObserver?.disconnect();
      controls.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    }
  };
}
