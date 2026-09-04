// Spellogica voor de minigolf-baan. Bewust los van React en van de DOM,
// zodat het rekenwerk apart te testen is.

export const FIELD = { w: 400, h: 620 };
export const BALL_R = 7;
export const HOLE_R = 13;

const FRICTION = 0.982;
const SAND_FRICTION = 0.9;
const STOP_SPEED = 0.12;
const MAX_POWER = 17;
const POWER_SCALE = 0.14;

// Muren en zand zijn assen-parallelle rechthoeken: simpel te tekenen,
// simpel te botsen, en genoeg voor een leuke baan.
export const COURSE = [
  {
    par: 2,
    start: { x: 200, y: 540 },
    hole: { x: 200, y: 110 },
    walls: [],
    sand: [],
  },
  {
    par: 3,
    start: { x: 90, y: 540 },
    hole: { x: 310, y: 110 },
    walls: [{ x: 150, y: 250, w: 100, h: 140 }],
    sand: [],
  },
  {
    par: 3,
    start: { x: 200, y: 545 },
    hole: { x: 200, y: 95 },
    walls: [
      { x: 0, y: 300, w: 150, h: 26 },
      { x: 250, y: 300, w: 150, h: 26 },
    ],
    sand: [{ x: 140, y: 380, w: 120, h: 90 }],
  },
  {
    par: 4,
    start: { x: 70, y: 550 },
    hole: { x: 330, y: 80 },
    walls: [
      { x: 120, y: 430, w: 26, h: 150 },
      { x: 254, y: 200, w: 26, h: 170 },
      { x: 120, y: 180, w: 160, h: 26 },
    ],
    sand: [{ x: 290, y: 380, w: 110, h: 110 }],
  },
  {
    par: 4,
    start: { x: 200, y: 560 },
    hole: { x: 200, y: 80 },
    walls: [
      { x: 60, y: 440, w: 120, h: 24 },
      { x: 220, y: 440, w: 120, h: 24 },
      { x: 60, y: 250, w: 24, h: 130 },
      { x: 316, y: 250, w: 24, h: 130 },
      { x: 150, y: 170, w: 100, h: 24 },
    ],
    sand: [
      { x: 0, y: 300, w: 60, h: 100 },
      { x: 340, y: 300, w: 60, h: 100 },
    ],
  },
];

export function totalPar() {
  return COURSE.reduce((sum, h) => sum + h.par, 0);
}

/** Slagkracht uit de sleepafstand; begrensd zodat je niet oneindig hard slaat. */
export function aimToVelocity(from, to) {
  // Slingshot: je trekt terug, de bal gaat de andere kant op.
  const dx = from.x - to.x;
  const dy = from.y - to.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return { vx: 0, vy: 0, power: 0 };

  const speed = Math.min(dist * POWER_SCALE, MAX_POWER);
  return {
    vx: (dx / dist) * speed,
    vy: (dy / dist) * speed,
    power: speed / MAX_POWER,
  };
}

function inRect(p, r, pad = 0) {
  return (
    p.x >= r.x - pad && p.x <= r.x + r.w + pad && p.y >= r.y - pad && p.y <= r.y + r.h + pad
  );
}

/**
 * Eén natuurkunde-stap. Geeft de nieuwe balstaat terug plus of hij stil ligt
 * en of hij erin zit. Muren laten hem stuiteren, zand remt hem extra af.
 */
export function stepBall(ball, hole, walls = [], sand = []) {
  let { x, y, vx, vy } = ball;

  x += vx;
  y += vy;

  // Randen van het speelveld
  if (x - BALL_R < 0) {
    x = BALL_R;
    vx = -vx;
  } else if (x + BALL_R > FIELD.w) {
    x = FIELD.w - BALL_R;
    vx = -vx;
  }
  if (y - BALL_R < 0) {
    y = BALL_R;
    vy = -vy;
  } else if (y + BALL_R > FIELD.h) {
    y = FIELD.h - BALL_R;
    vy = -vy;
  }

  // Muren: duw de bal uit de kortste kant en keer die snelheidscomponent om.
  for (const w of walls) {
    if (!inRect({ x, y }, w, BALL_R)) continue;

    const left = x - (w.x - BALL_R);
    const right = w.x + w.w + BALL_R - x;
    const top = y - (w.y - BALL_R);
    const bottom = w.y + w.h + BALL_R - y;
    const min = Math.min(left, right, top, bottom);

    if (min === left) {
      x = w.x - BALL_R;
      vx = -Math.abs(vx);
    } else if (min === right) {
      x = w.x + w.w + BALL_R;
      vx = Math.abs(vx);
    } else if (min === top) {
      y = w.y - BALL_R;
      vy = -Math.abs(vy);
    } else {
      y = w.y + w.h + BALL_R;
      vy = Math.abs(vy);
    }
  }

  const inSand = sand.some((s) => inRect({ x, y }, s));
  const f = inSand ? SAND_FRICTION : FRICTION;
  vx *= f;
  vy *= f;

  const speed = Math.hypot(vx, vy);
  if (speed < STOP_SPEED) {
    vx = 0;
    vy = 0;
  }

  // Erin: dicht genoeg bij het gat én niet te hard, anders wipt hij eroverheen.
  const distToHole = Math.hypot(x - hole.x, y - hole.y);
  const holed = distToHole < HOLE_R && speed < 6;

  return { x, y, vx, vy, moving: speed >= STOP_SPEED, holed, inSand };
}

/** Score t.o.v. par, met de gangbare golftermen. */
export function scoreName(strokes, par) {
  const diff = strokes - par;
  if (strokes === 1) return "Hole-in-one";
  if (diff <= -3) return "Albatros";
  if (diff === -2) return "Eagle";
  if (diff === -1) return "Birdie";
  if (diff === 0) return "Par";
  if (diff === 1) return "Bogey";
  if (diff === 2) return "Dubbel bogey";
  return `+${diff}`;
}

export function formatToPar(total, par) {
  const diff = total - par;
  if (diff === 0) return "Par";
  return diff > 0 ? `+${diff}` : `${diff}`;
}
