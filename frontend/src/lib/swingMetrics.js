// MediaPipe Pose landmark indices (BlazePose topology) die we gebruiken.
const LEFT_SHOULDER = 11;
const RIGHT_SHOULDER = 12;
const LEFT_WRIST = 15;
const RIGHT_WRIST = 16;
const LEFT_HIP = 23;
const RIGHT_HIP = 24;

// Hoek (in graden) van de lijn tussen twee punten t.o.v. horizontaal.
// Camera-afstand-onafhankelijk, dus betrouwbaarder dan absolute snelheid.
function lineAngleDegrees(a, b) {
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
}

function midpoint(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

// Kleinste verschil tussen twee hoeken (in graden), rekening houdend met de 360°-wraparound.
function angleDelta(a, b) {
  let diff = ((a - b + 540) % 360) - 180;
  return diff;
}

export function computeFrameAngles(landmarks) {
  const shoulderAngle = lineAngleDegrees(landmarks[LEFT_SHOULDER], landmarks[RIGHT_SHOULDER]);
  const hipAngle = lineAngleDegrees(landmarks[LEFT_HIP], landmarks[RIGHT_HIP]);
  const wristMid = midpoint(landmarks[LEFT_WRIST], landmarks[RIGHT_WRIST]);
  return { shoulderAngle, hipAngle, wristMid };
}

// Bouwt live statistieken voor het huidige frame t.o.v. de startpositie (address).
export function computeLiveMetrics(baseline, current) {
  const shoulderRotation = Math.abs(angleDelta(current.shoulderAngle, baseline.shoulderAngle));
  const hipRotation = Math.abs(angleDelta(current.hipAngle, baseline.hipAngle));
  const xFactor = Math.abs(shoulderRotation - hipRotation);
  return { shoulderRotation, hipRotation, xFactor };
}

// Relatieve polssnelheid tussen twee opeenvolgende frames (genormaliseerde
// beeldcoördinaten per seconde). Geen echte km/u zonder camera-kalibratie,
// dus alleen bruikbaar als relatieve maat binnen dezelfde video.
export function computeWristSpeed(prevWristMid, prevTime, currentWristMid, currentTime) {
  const dt = currentTime - prevTime;
  if (dt <= 0) return 0;
  const dx = currentWristMid.x - prevWristMid.x;
  const dy = currentWristMid.y - prevWristMid.y;
  return Math.sqrt(dx * dx + dy * dy) / dt;
}

// Simpele, regelgebaseerde fase-detectie op basis van de pols-hoogte (y) over tijd:
// - Address: eerste geanalyseerde frame
// - Top backswing: eerste lokale minimum in y (polsen stoppen met stijgen)
// - Impact: hoogste polssnelheid ná de top
// - Finish: laatste geanalyseerde frame
export function detectPhases(frames) {
  if (frames.length < 5) return null;

  const address = frames[0];

  let topIndex = 1;
  for (let i = 1; i < frames.length - 1; i++) {
    const prevY = frames[i - 1].wristMid.y;
    const curY = frames[i].wristMid.y;
    const nextY = frames[i + 1].wristMid.y;
    if (curY <= prevY && curY <= nextY) {
      topIndex = i;
      break;
    }
    topIndex = i;
  }
  const top = frames[topIndex];

  let impactIndex = topIndex;
  let maxSpeed = -1;
  for (let i = topIndex + 1; i < frames.length; i++) {
    if (frames[i].speed > maxSpeed) {
      maxSpeed = frames[i].speed;
      impactIndex = i;
    }
  }
  const impact = frames[impactIndex];

  const finish = frames[frames.length - 1];

  return { address, top, impact, finish };
}
