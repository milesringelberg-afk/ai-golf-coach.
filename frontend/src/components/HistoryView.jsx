import { useEffect, useState } from "react";
import Icon from "./Icon.jsx";
import { listAnalyses, deleteAnalysis, getVideoUrl } from "../lib/analyses.js";
import { friendlyError } from "../lib/supabase.js";
import { clubLabel } from "../lib/clubs.js";
import { scoreBand } from "../lib/swingScore.js";
import { angleLabel } from "../lib/cameraAngles.js";
import CompareStrip from "./CompareStrip.jsx";

function formatDate(iso) {
  return new Date(iso).toLocaleString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Metric({ label, value }) {
  return (
    <div className="history-metric">
      <span className="history-metric-value">
        {value == null ? "–" : `${Math.round(value)}°`}
      </span>
      <span className="history-metric-label">{label}</span>
    </div>
  );
}

function CoachOption({ tag, label, text }) {
  if (!text) return null;
  return (
    <div className="coach-option">
      <span className="coach-option-tag">
        <span className="coach-option-letter">{tag}</span>
        {label}
      </span>
      <p>{text}</p>
    </div>
  );
}

function AnalysisCard({ analysis, onDeleted, index, selected, onToggleSelect, selectDisabled }) {
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoState, setVideoState] = useState("idle"); // idle | loading | error
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const hasCoach =
    analysis.coach_root_cause || analysis.coach_feel || analysis.coach_prop || analysis.coach_mental;

  async function showVideo() {
    setVideoState("loading");
    try {
      const url = await getVideoUrl(analysis.video_path);
      setVideoUrl(url);
      setVideoState("idle");
    } catch {
      setVideoState("error");
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await deleteAnalysis(analysis);
      onDeleted(analysis.id);
    } catch (err) {
      setError(friendlyError(err) || "Verwijderen is mislukt.");
      setDeleting(false);
    }
  }

  return (
    <article className="history-card" style={{ animationDelay: `${index * 60}ms` }}>
      <header className="history-card-head">
        <div className="history-head-main">
          <div className="history-labels">
            {analysis.club && <span className="club-tag">{clubLabel(analysis.club)}</span>}
            {analysis.camera_angle && (
              <span className="angle-tag">{angleLabel(analysis.camera_angle)}</span>
            )}
            <p className="history-date">{formatDate(analysis.created_at)}</p>
          </div>
          {analysis.video_name && <p className="history-filename">{analysis.video_name}</p>}
        </div>
        <div className="history-head-right">
          <label
            className="compare-check"
            title={
              selectDisabled ? "Je kunt er twee tegelijk vergelijken" : "Selecteer om te vergelijken"
            }
          >
            <input
              type="checkbox"
              checked={selected}
              disabled={selectDisabled}
              onChange={() => onToggleSelect(analysis.id)}
            />
          </label>
          {analysis.swing_score != null && (
            <div className={`history-score history-score-${scoreBand(analysis.swing_score)}`}>
              <span className="history-score-value">{analysis.swing_score}</span>
              <span className="history-score-label">Score</span>
            </div>
          )}
          <button
            type="button"
            className="history-delete"
            onClick={handleDelete}
            disabled={deleting}
            aria-label="Verwijder deze swing"
          >
            <Icon name="trash" size={15} />
          </button>
        </div>
      </header>

      <div className="history-metrics">
        <Metric label="Kniebuiging" value={analysis.knee_flex} />
        <Metric label="Rughoek" value={analysis.spine_angle} />
        <Metric label="Schouders" value={analysis.shoulder_rotation} />
        <Metric label="Heupen" value={analysis.hip_rotation} />
        <Metric label="X-factor" value={analysis.x_factor} />
      </div>

      {error && (
        <p className="alert-chip alert-chip-error">
          <Icon name="alert" size={15} />
          {error}
        </p>
      )}

      {analysis.video_path && (
        <div className="history-video-block">
          {videoUrl ? (
            <video className="history-video" src={videoUrl} controls playsInline />
          ) : (
            <button
              type="button"
              className="phase-button"
              onClick={showVideo}
              disabled={videoState === "loading"}
            >
              {videoState === "loading" ? "Laden" : "Bekijk video"}
            </button>
          )}
          {videoState === "error" && (
            <p className="alert-chip alert-chip-error">
              <Icon name="alert" size={15} />
              Video kon niet worden geladen.
            </p>
          )}
        </div>
      )}

      {hasCoach ? (
        <>
          <button
            type="button"
            className="link-button history-toggle"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Verberg coach-advies" : "Toon coach-advies"}
          </button>
          {expanded && (
            <div className="coach-options">
              {analysis.coach_root_cause && (
                <div className="coach-option coach-option-root">
                  <span className="coach-option-tag">Oorzaak</span>
                  <p>{analysis.coach_root_cause}</p>
                </div>
              )}
              <CoachOption tag="A" label="Gevoel" text={analysis.coach_feel} />
              <CoachOption tag="B" label="Hulpmiddel" text={analysis.coach_prop} />
              <CoachOption tag="C" label="Mentaal" text={analysis.coach_mental} />
            </div>
          )}
        </>
      ) : (
        <p className="history-nocoach">
          Geen coach-advies opgeslagen bij deze swing.
        </p>
      )}
    </article>
  );
}

export default function HistoryView({ onNavigate }) {
  const [analyses, setAnalyses] = useState(null);
  const [error, setError] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  // Maximaal twee tegelijk: bij een derde valt de oudste selectie af.
  function toggleSelect(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(-2)
    );
  }

  useEffect(() => {
    let cancelled = false;
    listAnalyses()
      .then((rows) => {
        if (!cancelled) setAnalyses(rows);
      })
      .catch((err) => {
        if (!cancelled) setError(friendlyError(err) || "Kon je swings niet ophalen.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="view-empty">
        <Icon name="alert" size={32} className="view-empty-icon" />
        <h2>Ophalen mislukt</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (analyses === null) {
    return <p className="tab-hint">Je swings worden opgehaald</p>;
  }

  if (analyses.length === 0) {
    return (
      <div className="view-empty">
        <Icon name="folder" size={32} className="view-empty-icon" />
        <h2>Nog niets bewaard</h2>
        <p>
          Analyseer een swing en klik daarna op "Bewaar deze swing" om hem hier terug te vinden.
        </p>
        <button type="button" className="btn-primary" onClick={() => onNavigate("swing")}>
          Naar swing uploaden
        </button>
      </div>
    );
  }

  const scored = analyses.filter((a) => a.swing_score != null);
  const avgScore = scored.length
    ? Math.round(scored.reduce((sum, a) => sum + a.swing_score, 0) / scored.length)
    : null;
  const bestScore = scored.length ? Math.max(...scored.map((a) => a.swing_score)) : null;
  const clubsUsed = new Set(analyses.filter((a) => a.club).map((a) => a.club)).size;

  const selected = selectedIds
    .map((id) => analyses.find((a) => a.id === id))
    .filter(Boolean);
  // Oudste links, nieuwste rechts: zo lees je het verschil als vooruitgang.
  const pair =
    selected.length === 2
      ? [...selected].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      : null;

  const usedBytes = analyses.reduce((sum, a) => sum + (a.video_size || 0), 0);
  const usedMb = usedBytes / (1024 * 1024);
  const quotaMb = 1024;
  const usedPct = Math.min(100, (usedMb / quotaMb) * 100);

  return (
    <div className="history-view">
      <div className="hub-summary">
        <div className="hub-stat">
          <span className="hub-stat-value">{analyses.length}</span>
          <span className="hub-stat-label">Swings</span>
        </div>
        <div className="hub-stat">
          <span className="hub-stat-value">{avgScore ?? "–"}</span>
          <span className="hub-stat-label">Gem. score</span>
        </div>
        <div className="hub-stat">
          <span className="hub-stat-value">{bestScore ?? "–"}</span>
          <span className="hub-stat-label">Beste</span>
        </div>
        <div className="hub-stat">
          <span className="hub-stat-value">{clubsUsed || "–"}</span>
          <span className="hub-stat-label">Clubs</span>
        </div>
      </div>

      {usedBytes > 0 && (
        <div className="storage-meter">
          <div className="storage-head">
            <span className="storage-label">Opslag gebruikt</span>
            <span className="storage-value">
              {usedMb < 1 ? "<1" : Math.round(usedMb)} MB van {quotaMb / 1024} GB
            </span>
          </div>
          <div className="storage-track">
            <div className="storage-fill" style={{ width: `${usedPct}%` }} />
          </div>
          {usedPct > 80 && (
            <p className="storage-warn">
              Je zit tegen de gratis opslaggrens aan. Verwijder een oudere swing om ruimte te maken.
            </p>
          )}
        </div>
      )}

      {pair && <CompareStrip left={pair[0]} right={pair[1]} onClear={() => setSelectedIds([])} />}

      <p className="stats-disclaimer">
        De score meet alleen hoe dicht je kniebuiging en rughoek bij onze eigen richtlijnen liggen —
        bruikbaar om je swings onderling te vergelijken, geen golftechnisch oordeel.
      </p>

      <div className="history-grid">
        {analyses.map((analysis, i) => (
          <AnalysisCard
            key={analysis.id}
            analysis={analysis}
            index={i}
            selected={selectedIds.includes(analysis.id)}
            selectDisabled={selectedIds.length >= 2 && !selectedIds.includes(analysis.id)}
            onToggleSelect={toggleSelect}
            onDeleted={(id) => {
              setAnalyses((prev) => prev.filter((a) => a.id !== id));
              setSelectedIds((prev) => prev.filter((x) => x !== id));
            }}
          />
        ))}
      </div>
    </div>
  );
}
