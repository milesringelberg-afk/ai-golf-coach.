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

// Stuiterpalen geven energie terug: leuker dan een dode muur.
const BUMPER_BOUNCE = 1.15;

// Muren, zand en water zijn assen-parallelle rechthoeken; palen zijn cirkels.
export const COURSE = [
  {
    name: "Opwarmer",
    par: 2,
    start: { x: 200, y: 540 },
    hole: { x: 200, y: 110 },
  },
  {
    name: "Om het blok",
    par: 3,
    start: { x: 90, y: 540 },
    hole: { x: 310, y: 110 },
    walls: [{ x: 150, y: 250, w: 100, h: 140 }],
  },
  {
    name: "De poort",
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
    // Water in het midden, met een vrije baan langs beide kanten.
    name: "Eerste plons",
    par: 3,
    start: { x: 200, y: 550 },
    hole: { x: 200, y: 90 },
    water: [{ x: 110, y: 270, w: 180, h: 80 }],
  },
  {
    name: "Zigzag",
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
    name: "Flipperkast",
    par: 3,
    start: { x: 200, y: 550 },
    hole: { x: 200, y: 90 },
    bumpers: [
      { x: 130, y: 330, r: 22 },
      { x: 270, y: 330, r: 22 },
      { x: 200, y: 220, r: 26 },
    ],
  },
  {
    name: "De trechter",
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
  {
    name: "Eiland",
    par: 4,
    start: { x: 200, y: 555 },
    hole: { x: 200, y: 150 },
    water: [
      { x: 0, y: 230, w: 145, h: 200 },
      { x: 255, y: 230, w: 145, h: 200 },
    ],
    sand: [{ x: 160, y: 440, w: 80, h: 60 }],
  },
  {
    name: "Slalom",
    par: 4,
    start: { x: 60, y: 560 },
    hole: { x: 340, y: 70 },
    walls: [
      { x: 0, y: 470, w: 260, h: 22 },
      { x: 140, y: 360, w: 260, h: 22 },
      { x: 0, y: 250, w: 260, h: 22 },
      { x: 140, y: 140, w: 260, h: 22 },
    ],
  },
  {
    name: "Kooi",
    par: 4,
    start: { x: 200, y: 555 },
    hole: { x: 200, y: 105 },
    walls: [
      { x: 110, y: 170, w: 22, h: 140 },
      { x: 268, y: 170, w: 22, h: 140 },
      { x: 110, y: 170, w: 60, h: 20 },
      { x: 230, y: 170, w: 60, h: 20 },
    ],
    bumpers: [{ x: 200, y: 400, r: 24 }],
    sand: [{ x: 60, y: 440, w: 90, h: 80 }],
  },
  {
    name: "Smalle doorgang",
    par: 4,
    start: { x: 200, y: 560 },
    hole: { x: 200, y: 75 },
    water: [
      { x: 0, y: 300, w: 165, h: 60 },
      { x: 235, y: 300, w: 165, h: 60 },
    ],
    walls: [
      { x: 60, y: 180, w: 130, h: 20 },
      { x: 240, y: 180, w: 130, h: 20 },
    ],
    bumpers: [{ x: 200, y: 440, r: 20 }],
  },
  {
    name: "Finale",
    par: 5,
    start: { x: 70, y: 560 },
    hole: { x: 330, y: 70 },
    walls: [
      { x: 140, y: 480, w: 22, h: 130 },
      { x: 240, y: 340, w: 22, h: 140 },
      { x: 60, y: 300, w: 130, h: 20 },
      { x: 150, y: 150, w: 22, h: 120 },
    ],
    water: [{ x: 260, y: 180, w: 140, h: 90 }],
    sand: [{ x: 60, y: 380, w: 100, h: 80 }],
    bumpers: [{ x: 300, y: 470, r: 22 }],
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
 * Eén natuurkunde-stap. Geeft de nieuwe balstaat terug plus of hij stil ligt,
 * of hij erin zit, en of hij in het water ligt (strafslag).
 */
export function stepBall(ball, hole, opts = {}) {
  const { walls = [], sand = [], water = [], bumpers = [] } = opts;
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

  // Stuiterpalen: weerkaatsen langs de lijn tussen middelpunten.
  for (const b of bumpers) {
    const dx = x - b.x;
    const dy = y - b.y;
    const dist = Math.hypot(dx, dy);
    const minDist = b.r + BALL_R;
    if (dist >= minDist || dist === 0) continue;

    const nx = dx / dist;
    const ny = dy / dist;
    // Bal net buiten de paal zetten, anders blijft hij plakken.
    x = b.x + nx * minDist;
    y = b.y + ny * minDist;

    const dot = vx * nx + vy * ny;
    vx = (vx - 2 * dot * nx) * BUMPER_BOUNCE;
    vy = (vy - 2 * dot * ny) * BUMPER_BOUNCE;
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

  // Water: zodra het middelpunt erin ligt is het raak (strafslag).
  const inWater = water.some((w) => inRect({ x, y }, w));

  // Erin: dicht genoeg bij het gat én niet te hard, anders wipt hij eroverheen.
  const distToHole = Math.hypot(x - hole.x, y - hole.y);
  const holed = !inWater && distToHole < HOLE_R && speed < 6;

  return { x, y, vx, vy, moving: speed >= STOP_SPEED, holed, inSand, inWater };
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
