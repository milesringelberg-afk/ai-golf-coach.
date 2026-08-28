import { useState } from "react";
import { saveAnalysis } from "../lib/analyses.js";
import { parseCoachSections } from "../lib/parseCoach.js";
import { friendlyError } from "../lib/supabase.js";

function formatSize(bytes) {
  if (!bytes) return null;
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

export default function SaveSwingBar({
  session,
  videoFile,
  addressPosture,
  liveMetrics,
  phases,
  coachText,
  onNavigate,
}) {
  const [status, setStatus] = useState("idle"); // idle | saving | saved | error
  const [error, setError] = useState(null);

  const hasMetrics = Boolean(addressPosture || liveMetrics);

  if (!session) {
    return (
      <div className="save-bar">
        <div className="save-bar-text">
          <p className="save-bar-title">Deze swing bewaren?</p>
          <p className="save-bar-sub">Log in om je swings op te slaan en later terug te kijken.</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => onNavigate("account")}>
          Inloggen
        </button>
      </div>
    );
  }

  async function handleSave() {
    setStatus("saving");
    setError(null);
    try {
      await saveAnalysis({
        file: videoFile,
        addressPosture,
        liveMetrics,
        phases,
        coach: parseCoachSections(coachText),
      });
      setStatus("saved");
    } catch (err) {
      setError(friendlyError(err) || "Opslaan is mislukt.");
      setStatus("error");
    }
  }

  if (status === "saved") {
    return (
      <div className="save-bar save-bar-done">
        <div className="save-bar-text">
          <p className="save-bar-title">✅ Swing bewaard</p>
          <p className="save-bar-sub">Je vindt hem terug onder Historie.</p>
        </div>
        <button type="button" className="phase-button" onClick={() => onNavigate("history")}>
          Bekijk historie
        </button>
      </div>
    );
  }

  return (
    <div className="save-bar">
      <div className="save-bar-text">
        <p className="save-bar-title">Deze swing bewaren?</p>
        <p className="save-bar-sub">
          {hasMetrics
            ? "Metingen en video worden opgeslagen in je eigen account."
            : "Speel de video eerst af met \"Lichaamshouding tonen\" aan, dan worden ook de hoeken bewaard."}
          {videoFile && ` · video ${formatSize(videoFile.size)}`}
        </p>
        {error && (
          <p className="alert-chip alert-chip-error">
            <span>⚠️</span> {error}
          </p>
        )}
      </div>
      <button
        type="button"
        className="btn-primary"
        onClick={handleSave}
        disabled={status === "saving"}
      >
        {status === "saving" ? "Opslaan…" : "Bewaar deze swing"}
      </button>
    </div>
  );
}
