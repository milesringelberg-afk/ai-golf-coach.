import { useEffect, useState } from "react";
import { listAnalyses, deleteAnalysis, getVideoUrl } from "../lib/analyses.js";
import { friendlyError } from "../lib/supabase.js";

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
        {tag} {label}
      </span>
      <p>{text}</p>
    </div>
  );
}

function AnalysisCard({ analysis, onDeleted, index }) {
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
        <div>
          <p className="history-date">{formatDate(analysis.created_at)}</p>
          {analysis.video_name && <p className="history-filename">{analysis.video_name}</p>}
        </div>
        <button
          type="button"
          className="history-delete"
          onClick={handleDelete}
          disabled={deleting}
          aria-label="Verwijder deze swing"
        >
          {deleting ? "…" : "🗑"}
        </button>
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
          <span>⚠️</span> {error}
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
              {videoState === "loading" ? "Laden…" : "▶ Bekijk video"}
            </button>
          )}
          {videoState === "error" && (
            <p className="alert-chip alert-chip-error">
              <span>⚠️</span> Video kon niet worden geladen.
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
                  <span className="coach-option-tag">🔍 Oorzaak</span>
                  <p>{analysis.coach_root_cause}</p>
                </div>
              )}
              <CoachOption tag="🅰️" label="Gevoel" text={analysis.coach_feel} />
              <CoachOption tag="🅱️" label="Hulpmiddel" text={analysis.coach_prop} />
              <CoachOption tag="🅲" label="Mentaal" text={analysis.coach_mental} />
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
        <div className="view-empty-icon">⚠️</div>
        <h2>Ophalen mislukt</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (analyses === null) {
    return <p className="tab-hint">Je swings worden opgehaald…</p>;
  }

  if (analyses.length === 0) {
    return (
      <div className="view-empty">
        <div className="view-empty-icon">📁</div>
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

  return (
    <div className="history-view">
      <p className="tab-hint history-count">
        {analyses.length} {analyses.length === 1 ? "bewaarde swing" : "bewaarde swings"}
      </p>
      <div className="history-grid">
        {analyses.map((analysis, i) => (
          <AnalysisCard
            key={analysis.id}
            analysis={analysis}
            index={i}
            onDeleted={(id) => setAnalyses((prev) => prev.filter((a) => a.id !== id))}
          />
        ))}
      </div>
    </div>
  );
}
