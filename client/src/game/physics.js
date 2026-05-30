// Track constants
export const TRACK_INNER = 15;
export const TRACK_OUTER = 25;
export const TRACK_MID = (TRACK_INNER + TRACK_OUTER) / 2;
export const TOTAL_LAPS = 3;

// Car tuning
const ACCEL = 22;
const MAX_SPEED = 28;
const REVERSE_MAX = -8;
const FRICTION = 0.96;
const BRAKE_FRICTION = 0.88;
const STEER_SPEED = 2.4;
const BOUNDARY_BOUNCE = 0.4;

export function createCarState(position, rotation = Math.PI / 2) {
  return {
    position: { ...position },
    rotation,
    speed: 0,
    lap: 1,
    checkpoint: false, // passed the top half-track line?
    finished: false,
    finishTime: null,
  };
}

export function updateCar(state, input, dt) {
  let { position, rotation, speed, lap, checkpoint } = state;

  // Clamp dt to avoid spiral-of-death
  const d = Math.min(dt, 0.05);

  // Thrust
  if (input.forward) speed += ACCEL * d;
  if (input.brake) speed -= ACCEL * d;

  // Friction
  const friction = input.brake && speed > 0 ? BRAKE_FRICTION : FRICTION;
  speed *= Math.pow(friction, d * 60);
  if (Math.abs(speed) < 0.01) speed = 0;

  // Speed limits
  speed = Math.max(REVERSE_MAX, Math.min(MAX_SPEED, speed));

  // Steering (only effective when moving)
  if (Math.abs(speed) > 0.3) {
    const steerDir = speed > 0 ? 1 : -1;
    const speedFactor = Math.min(1, Math.abs(speed) / MAX_SPEED);
    const effectiveSteer = STEER_SPEED * (1 - speedFactor * 0.4);
    if (input.left) rotation += effectiveSteer * steerDir * d;
    if (input.right) rotation -= effectiveSteer * steerDir * d;
  }

  // Move
  let x = position.x + Math.sin(rotation) * speed * d;
  let z = position.z + Math.cos(rotation) * speed * d;

  // Track boundary constraint
  const dist = Math.sqrt(x * x + z * z);
  if (dist < TRACK_INNER || dist > TRACK_OUTER) {
    // Push back onto track
    const clampDist = Math.max(TRACK_INNER + 0.3, Math.min(TRACK_OUTER - 0.3, dist));
    const scale = clampDist / (dist || 1);
    x *= scale;
    z *= scale;
    speed *= BOUNDARY_BOUNCE;
  }

  // Checkpoint detection (clockwise: start at z=20 east, top at z=-20)
  // Half-track checkpoint: crossing x=0 going west (neg x) at z < -10
  const crossedNorth =
    position.x > 0.5 && x <= 0 && z < -10 && dist > TRACK_INNER && dist < TRACK_OUTER;
  if (crossedNorth && !checkpoint) {
    checkpoint = true;
  }

  // Start/finish: crossing x=0 going east (pos x) at z > 10, after half-track
  const crossedFinish =
    position.x < -0.5 && x >= 0 && z > 10 && dist > TRACK_INNER && dist < TRACK_OUTER;
  if (crossedFinish && checkpoint) {
    checkpoint = false;
    if (lap < TOTAL_LAPS) {
      lap++;
    } else {
      // Finished!
      return {
        ...state,
        position: { x, y: position.y, z },
        rotation,
        speed,
        lap,
        checkpoint,
        finished: true,
        finishTime: Date.now(),
      };
    }
  }

  return {
    ...state,
    position: { x, y: position.y, z },
    rotation,
    speed,
    lap,
    checkpoint,
  };
}

// Interpolate remote car state for smooth rendering
export function interpolateState(current, target, alpha = 0.15) {
  if (!current || !target) return target || current;
  return {
    ...target,
    position: {
      x: current.position.x + (target.position.x - current.position.x) * alpha,
      y: current.position.y + (target.position.y - current.position.y) * alpha,
      z: current.position.z + (target.position.z - current.position.z) * alpha,
    },
    rotation: lerpAngle(current.rotation, target.rotation, alpha),
    speed: current.speed + (target.speed - current.speed) * alpha,
  };
}

function lerpAngle(a, b, t) {
  let diff = b - a;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  return a + diff * t;
}

export function getSpeedKPH(speed) {
  return Math.round(Math.abs(speed) * 12);
}
