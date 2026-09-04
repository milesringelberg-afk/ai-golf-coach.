import { useEffect, useRef, useState } from "react";
import {
  COURSE,
  FIELD,
  BALL_R,
  HOLE_R,
  aimToVelocity,
  stepBall,
  scoreName,
  formatToPar,
  totalPar,
} from "../lib/golfGame.js";

const BEST_KEY = "golfcoach.minigolf.best";
const TRAIL_LENGTH = 14;

function readBest() {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    return raw ? Number(raw) : null;
  } catch {
    return null;
  }
}

function writeBest(value) {
  try {
    localStorage.setItem(BEST_KEY, String(value));
  } catch {
    /* privémodus of opslag uit: dan onthouden we het gewoon niet */
  }
}

export default function GameView() {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);

  const [holeIndex, setHoleIndex] = useState(0);
  const [strokes, setStrokes] = useState(0);
  const [scores, setScores] = useState([]);
  const [status, setStatus] = useState("aiming"); // aiming | rolling | holed | finished
  const [splash, setSplash] = useState(false);
  const [best, setBest] = useState(readBest);

  const hole = COURSE[holeIndex];

  // Spelstaat leeft in een ref: de tekenlus mag niet elke frame een
  // re-render veroorzaken.
  function resetBall() {
    stateRef.current = {
      ball: { x: hole.start.x, y: hole.start.y, vx: 0, vy: 0 },
      aim: null,
      shotFrom: { x: hole.start.x, y: hole.start.y },
      trail: [],
    };
  }

  useEffect(() => {
    resetBall();
    setStrokes(0);
    setStatus("aiming");
    setSplash(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holeIndex]);

  function retryHole() {
    resetBall();
    setStatus("aiming");
    setSplash(false);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;

    function toField(event) {
      const rect = canvas.getBoundingClientRect();
      const point = event.touches?.[0] ?? event;
      return {
        x: ((point.clientX - rect.left) / rect.width) * FIELD.w,
        y: ((point.clientY - rect.top) / rect.height) * FIELD.h,
      };
    }

    function onDown(event) {
      const s = stateRef.current;
      if (!s || s.ball.vx || s.ball.vy) return;
      const p = toField(event);
      // Alleen richten als je bij de bal begint.
      if (Math.hypot(p.x - s.ball.x, p.y - s.ball.y) > 45) return;
      event.preventDefault();
      s.aim = p;
    }

    function onMove(event) {
      const s = stateRef.current;
      if (!s?.aim) return;
      event.preventDefault();
      s.aim = toField(event);
    }

    function onUp() {
      const s = stateRef.current;
      if (!s?.aim) return;
      const { vx, vy, power } = aimToVelocity(s.ball, s.aim);
      s.aim = null;
      if (power < 0.04) return; // te klein tikje: geldt niet als slag
      s.shotFrom = { x: s.ball.x, y: s.ball.y };
      s.trail = [];
      s.ball.vx = vx;
      s.ball.vy = vy;
      setStrokes((n) => n + 1);
      setStatus("rolling");
    }

    canvas.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    canvas.addEventListener("touchstart", onDown, { passive: false });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);

    function draw() {
      const s = stateRef.current;
      if (!s) return;

      ctx.clearRect(0, 0, FIELD.w, FIELD.h);
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, FIELD.w, FIELD.h);

      // Water
      ctx.fillStyle = "rgba(80, 170, 255, 0.16)";
      ctx.strokeStyle = "rgba(120, 190, 255, 0.5)";
      ctx.lineWidth = 1;
      for (const w of hole.water ?? []) {
        ctx.fillRect(w.x, w.y, w.w, w.h);
        ctx.strokeRect(w.x + 0.5, w.y + 0.5, w.w - 1, w.h - 1);
      }

      // Zand
      ctx.fillStyle = "rgba(255,255,255,0.07)";
      for (const sand of hole.sand ?? []) ctx.fillRect(sand.x, sand.y, sand.w, sand.h);

      // Muren
      ctx.fillStyle = "rgba(255,255,255,0.16)";
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      for (const w of hole.walls ?? []) {
        ctx.fillRect(w.x, w.y, w.w, w.h);
        ctx.strokeRect(w.x + 0.5, w.y + 0.5, w.w - 1, w.h - 1);
      }

      // Stuiterpalen
      for (const b of hole.bumpers ?? []) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(204, 255, 0, 0.12)";
        ctx.fill();
        ctx.strokeStyle = "#ccff00";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Gat
      ctx.beginPath();
      ctx.arc(hole.hole.x, hole.hole.y, HOLE_R, 0, Math.PI * 2);
      ctx.fillStyle = "#0a0a0a";
      ctx.fill();
      ctx.strokeStyle = "#ccff00";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Spoor van de bal
      s.trail.forEach((p, i) => {
        const alpha = ((i + 1) / s.trail.length) * 0.28;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fill();
      });

      // Richtlijn
      if (s.aim) {
        const { power } = aimToVelocity(s.ball, s.aim);
        const dx = s.ball.x - s.aim.x;
        const dy = s.ball.y - s.aim.y;
        const len = Math.hypot(dx, dy) || 1;
        const shown = Math.min(len, 130);
        ctx.beginPath();
        ctx.moveTo(s.ball.x, s.ball.y);
        ctx.lineTo(s.ball.x + (dx / len) * shown, s.ball.y + (dy / len) * shown);
        ctx.strokeStyle = "#ccff00";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Krachtbalkje links onderin
        ctx.fillStyle = "rgba(255,255,255,0.12)";
        ctx.fillRect(14, FIELD.h - 30, 120, 5);
        ctx.fillStyle = "#ccff00";
        ctx.fillRect(14, FIELD.h - 30, 120 * power, 5);
      }

      // Bal
      ctx.beginPath();
      ctx.arc(s.ball.x, s.ball.y, BALL_R, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
    }

    // Vaste stap van 60 per seconde. Zonder dit rekent de natuurkunde per
    // beeldje, en rolt de bal op een 120Hz-scherm twee keer zo ver.
    const STEP_MS = 1000 / 60;
    let lastFrame = performance.now();
    let backlog = 0;

    function tick(now) {
      const s = stateRef.current;
      if (!s) return;

      // Na een verborgen tabblad niet honderden stappen inhalen.
      backlog = Math.min(backlog + (now - lastFrame), 250);
      lastFrame = now;

      while (backlog >= STEP_MS) {
        backlog -= STEP_MS;
        if (!s.ball.vx && !s.ball.vy) continue;

        const next = stepBall(s.ball, hole.hole, hole);
        s.ball = { x: next.x, y: next.y, vx: next.vx, vy: next.vy };

        s.trail.push({ x: next.x, y: next.y });
        if (s.trail.length > TRAIL_LENGTH) s.trail.shift();

        if (next.inWater) {
          // Strafslag: terug naar waar je vandaan sloeg.
          s.ball = { ...s.shotFrom, vx: 0, vy: 0 };
          s.trail = [];
          setStrokes((n) => n + 1);
          setSplash(true);
          setStatus("aiming");
          break;
        }
        if (next.holed) {
          s.ball.vx = 0;
          s.ball.vy = 0;
          setStatus("holed");
          break;
        }
        if (!next.moving) {
          setStatus("aiming");
          break;
        }
      }
      draw();
      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      canvas.removeEventListener("touchstart", onDown);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [hole]);

  // Plons-melding vanzelf laten verdwijnen.
  useEffect(() => {
    if (!splash) return;
    const timer = setTimeout(() => setSplash(false), 1600);
    return () => clearTimeout(timer);
  }, [splash]);

  function nextHole() {
    const updated = [...scores, strokes];
    setScores(updated);

    if (holeIndex + 1 >= COURSE.length) {
      const total = updated.reduce((a, b) => a + b, 0);
      if (best == null || total < best) {
        writeBest(total);
        setBest(total);
      }
      setStatus("finished");
    } else {
      setHoleIndex(holeIndex + 1);
    }
  }

  function restart() {
    setScores([]);
    setHoleIndex(0);
    setStrokes(0);
    setStatus("aiming");
  }

  if (status === "finished") {
    const total = scores.reduce((a, b) => a + b, 0);
    const par = totalPar();
    return (
      <div className="game-view">
        <div className="view-empty">
          <h2>Ronde uitgespeeld</h2>
          <div className="game-final">
            <div className="hub-stat">
              <span className="hub-stat-value">{total}</span>
              <span className="hub-stat-label">Slagen</span>
            </div>
            <div className="hub-stat">
              <span className="hub-stat-value">{formatToPar(total, par)}</span>
              <span className="hub-stat-label">T.o.v. par {par}</span>
            </div>
            <div className="hub-stat">
              <span className="hub-stat-value">{best ?? "–"}</span>
              <span className="hub-stat-label">Beste ooit</span>
            </div>
          </div>
          <ol className="game-scorecard">
            {scores.map((s, i) => (
              <li key={i}>
                <span>
                  {i + 1}. {COURSE[i].name}
                </span>
                <span className="game-scorecard-value">{s}</span>
                <span className="game-scorecard-name">{scoreName(s, COURSE[i].par)}</span>
              </li>
            ))}
          </ol>
          <button type="button" className="btn-primary" onClick={restart}>
            Opnieuw spelen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-view">
      <div className="game-hud">
        <div className="game-stat">
          <span className="game-stat-value">
            {holeIndex + 1}
            <span className="game-stat-sub">/{COURSE.length}</span>
          </span>
          <span className="game-stat-label">Hole</span>
        </div>
        <div className="game-stat">
          <span className="game-stat-value">{hole.par}</span>
          <span className="game-stat-label">Par</span>
        </div>
        <div className="game-stat">
          <span className="game-stat-value">{strokes}</span>
          <span className="game-stat-label">Slagen</span>
        </div>
        <div className="game-stat">
          <span className="game-stat-value">{best ?? "–"}</span>
          <span className="game-stat-label">Beste ronde</span>
        </div>
      </div>

      <p className="game-hole-name">{hole.name}</p>

      <div className="game-board">
        <canvas
          ref={canvasRef}
          width={FIELD.w}
          height={FIELD.h}
          className="game-canvas"
          aria-label={`Minigolf hole ${holeIndex + 1}: ${hole.name}`}
        />

        {splash && status !== "holed" && (
          <p className="game-splash">Water — strafslag</p>
        )}

        {status === "holed" && (
          <div className="game-overlay">
            <p className="game-overlay-title">{scoreName(strokes, hole.par)}</p>
            <p className="game-overlay-sub">
              {strokes} {strokes === 1 ? "slag" : "slagen"} · par {hole.par}
            </p>
            <button type="button" className="btn-primary" onClick={nextHole}>
              {holeIndex + 1 >= COURSE.length ? "Kaart afronden" : "Volgende hole"}
            </button>
          </div>
        )}
      </div>

      <div className="game-actions">
        <button type="button" className="phase-button" onClick={retryHole}>
          Hole opnieuw
        </button>
      </div>

      <p className="tab-hint game-help">
        Sleep vanaf de bal naar achteren en laat los — hoe verder je trekt, hoe harder de slag.
        Muren en palen laten de bal stuiteren, zand remt hem af, en water kost een strafslag.
      </p>
    </div>
  );
}
