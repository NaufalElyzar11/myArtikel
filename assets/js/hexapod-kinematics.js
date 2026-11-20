(() => {
  'use strict';

  const DEG2RAD = Math.PI / 180;
  const TWO_PI = Math.PI * 2;
  const DEFAULT_STAND_HEIGHT = 0.105;
  const INTERLOCK_SLOPE_DEG = 18;
  const INTERLOCK_DROP_M = 0.018;
  const INTERLOCK_STRIDE_SCALE = 0.6;
  const MAX_LINEAR_STEP = 0.036;
  const MAX_TURN_RAD = 0.28;
  const STEP_LIFT_M = 0.028;

  // Dimensions derived from Hexaka V3 CAD (Top/Bottom plate ~202x262 mm, 1 unit = 1 meter).
  const DEFAULT_LEGS = [
    { id: 0, side: 'right', role: 'front', mount: { x: -0.047, y: -0.018, z: 0.108 }, baseYaw: -Math.PI * 0.75, tripodPhase: 0 },
    { id: 1, side: 'right', role: 'mid', mount: { x: -0.087, y: -0.018, z: 0 }, baseYaw: Math.PI, tripodPhase: Math.PI },
    { id: 2, side: 'right', role: 'rear', mount: { x: -0.047, y: -0.018, z: -0.108 }, baseYaw: Math.PI * 0.75, tripodPhase: 0 },
    { id: 3, side: 'left', role: 'front', mount: { x: 0.047, y: -0.018, z: 0.108 }, baseYaw: -Math.PI * 0.25, tripodPhase: Math.PI },
    { id: 4, side: 'left', role: 'mid', mount: { x: 0.087, y: -0.018, z: 0 }, baseYaw: 0, tripodPhase: 0 },
    { id: 5, side: 'left', role: 'rear', mount: { x: 0.047, y: -0.018, z: -0.108 }, baseYaw: Math.PI * 0.25, tripodPhase: Math.PI }
  ];

  const DEFAULT_SEGMENTS = {
    coxa: 0.048,
    femur: 0.072,
    tibia: 0.118,
    neutralReach: 0.130
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function normalizeAngle(rad) {
    let a = rad;
    while (a > Math.PI) a -= TWO_PI;
    while (a < -Math.PI) a += TWO_PI;
    return a;
  }

  /**
   * Solve 3-DOF analytical IK for a leg whose zero-pose extends along local +X with +Y up.
   */
  function solveLegIK(mount, baseYaw, target, segments = DEFAULT_SEGMENTS) {
    const dx = target.x - mount.x;
    const dy = target.y - mount.y;
    const dz = target.z - mount.z;

    const worldYaw = Math.atan2(-dz, dx);
    const coxa = clamp(normalizeAngle(worldYaw - baseYaw), -1.15, 1.15);

    const horiz = Math.hypot(dx, dz);
    const r = Math.max(0.01, horiz - segments.coxa);
    const minD = Math.abs(segments.femur - segments.tibia) + 0.002;
    const maxD = segments.femur + segments.tibia - 0.002;
    const d = clamp(Math.hypot(r, dy), minD, maxD);

    const phi = Math.atan2(dy, r);
    const cosAlpha = clamp(
      (segments.femur * segments.femur + d * d - segments.tibia * segments.tibia) / (2 * segments.femur * d),
      -1,
      1
    );
    const cosBeta = clamp(
      (segments.femur * segments.femur + segments.tibia * segments.tibia - d * d) / (2 * segments.femur * segments.tibia),
      -1,
      1
    );

    const alpha = Math.acos(cosAlpha);
    const beta = Math.acos(cosBeta);

    return {
      coxa,
      femur: phi + alpha,
      tibia: -(Math.PI - beta)
    };
  }

  /**
   * Compute forward kinematics foot world position from joint angles for verification and testing.
   */
  function solveLegFK(mount, baseYaw, angles, segments = DEFAULT_SEGMENTS) {
    const yaw = baseYaw + angles.coxa;
    const r = segments.coxa + segments.femur * Math.cos(angles.femur) + segments.tibia * Math.cos(angles.femur + angles.tibia);
    const y = mount.y + segments.femur * Math.sin(angles.femur) + segments.tibia * Math.sin(angles.femur + angles.tibia);
    return {
      x: mount.x + Math.cos(yaw) * r,
      y,
      z: mount.z - Math.sin(yaw) * r
    };
  }

  function computeTelemetry(slopeDeg) {
    const clampedSlope = clamp(Number(slopeDeg) || 0, 0, 22);
    const interlock = clampedSlope >= INTERLOCK_SLOPE_DEG;
    return {
      slopeDeg: clampedSlope,
      pidCorrectionDeg: Number((-clampedSlope * 0.94).toFixed(1)),
      interlock,
      gaitLabel: interlock ? 'INTERLOCK' : 'TRIPOD 3+3',
      bodyDropM: interlock ? INTERLOCK_DROP_M : 0,
      strideScale: interlock ? INTERLOCK_STRIDE_SCALE : 1
    };
  }

  /**
   * Compute chassis pose and 18 joint angles for the current command, IMU slope, and gait phase.
   */
  function computePose({
    vx = 0,
    omega = 0,
    slopeDeg = 0,
    phase = 0,
    legs = DEFAULT_LEGS,
    segments = DEFAULT_SEGMENTS
  } = {}) {
    const telemetry = computeTelemetry(slopeDeg);
    const slopeRad = telemetry.slopeDeg * DEG2RAD;
    const mountDrop = Math.abs(legs[0]?.mount?.y ?? 0.018);
    const legSpan = segments.femur + segments.tibia;
    const standHeight = mountDrop > 0.03
      ? mountDrop + segments.tibia * 0.68
      : DEFAULT_STAND_HEIGHT;
    const interlockDrop = telemetry.interlock ? Math.min(INTERLOCK_DROP_M, segments.tibia * 0.22) : 0;
    const motionMag = clamp(Math.hypot(vx, omega), 0, 1);
    const isMoving = motionMag > 0.002;
    // Scale foot lift smoothly with speed magnitude so decelerations set lifted feet down gently.
    const liftScale = clamp(motionMag * 1.35, 0, 1);
    const gaitBounce = isMoving ? Math.abs(Math.sin(phase)) * 0.0016 * motionMag : 0;
    const bodyHeight = standHeight - interlockDrop + gaitBounce;
    const tanSlope = Math.tan(slopeRad);
    const cosSlope = Math.cos(slopeRad);
    const maxLinStep = Math.min(MAX_LINEAR_STEP, legSpan * 0.24);
    const stepLift = Math.min(STEP_LIFT_M, legSpan * 0.20);

    const jointTargets = legs.map(leg => {
      const neutralX = leg.mount.x + Math.cos(leg.baseYaw) * segments.neutralReach;
      const neutralZ = leg.mount.z - Math.sin(leg.baseYaw) * segments.neutralReach;

      let strideProgress = 0;
      let lift = 0;

      if (isMoving) {
        const localPhase = ((phase + leg.tripodPhase) % TWO_PI + TWO_PI) % TWO_PI;
        if (localPhase < Math.PI) {
          const swingT = localPhase / Math.PI;
          strideProgress = -Math.cos(swingT * Math.PI);
          lift = stepLift * telemetry.strideScale * liftScale * Math.sin(swingT * Math.PI);
        } else {
          const stanceT = (localPhase - Math.PI) / Math.PI;
          strideProgress = 1 - 2 * stanceT;
        }
      }

      const linZ = vx * telemetry.strideScale * maxLinStep;
      const angX = neutralZ * omega * telemetry.strideScale * MAX_TURN_RAD;
      const angZ = -neutralX * omega * telemetry.strideScale * MAX_TURN_RAD;

      const rawStepX = angX;
      const rawStepZ = linZ + angZ;
      const stepMag = Math.hypot(rawStepX, rawStepZ);
      const maxStep = maxLinStep * telemetry.strideScale;
      const clampFactor = stepMag > maxStep && stepMag > 0 ? maxStep / stepMag : 1;

      const targetX = neutralX + strideProgress * rawStepX * clampFactor;
      const targetZ = neutralZ + strideProgress * rawStepZ * clampFactor;
      const floorY = -bodyHeight + targetZ * tanSlope;
      const targetY = floorY + lift * cosSlope;

      const angles = solveLegIK(leg.mount, leg.baseYaw, { x: targetX, y: targetY, z: targetZ }, segments);
      return {
        id: leg.id,
        angles,
        footTarget: { x: targetX, y: targetY, z: targetZ }
      };
    });

    // BNO055 closed-loop leveling compensates 94% of terrain slope plus subtle inertia lean while walking.
    const residualPitchRad = -slopeRad * 0.06 + vx * 0.022;
    const bodyRollRad = omega * 0.018;

    return {
      telemetry,
      bodyHeight,
      bodyPitchRad: residualPitchRad,
      bodyRollRad,
      floorPitchRad: -slopeRad,
      legs: jointTargets
    };
  }

  const api = {
    DEFAULT_LEGS,
    DEFAULT_SEGMENTS,
    DEFAULT_STAND_HEIGHT,
    INTERLOCK_SLOPE_DEG,
    solveLegIK,
    solveLegFK,
    computeTelemetry,
    computePose
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (typeof window !== 'undefined') {
    window.HexapodKinematics = api;
  }
})();
