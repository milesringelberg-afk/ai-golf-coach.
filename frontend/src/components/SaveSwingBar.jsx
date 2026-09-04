import { useState } from "react";
import { saveAnalysis } from "../lib/analyses.js";
import { parseCoachSections } from "../lib/parseCoach.js";
import { friendlyError } from "../lib/supabase.js";
import { computeSwingScore } from "../lib/swingScore.js";
import { CLUB_GROUPS } from "../lib/clubs.js";
import Icon from "./Icon.jsx";

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
  cameraAngle,
  onNavigate,
}) {
  const [status, setStatus] = useState("idle"); // idle | saving | saved | error
  const [error, setError] = useState(null);
  const [club, setClub] = useState("");

  const hasMetrics = Boolean(addressPosture || liveMetrics);
  const score = computeSwingScore(addressPosture);

  if (!session) {
    return (
      <div className="save-bar">
        <div className="save-bar-text">
          <p className="save-bar-title">Deze swing bewaren?</p>
          <p className="save-bar-sub">Log in op je Player Hub om swings op te slaan.</p>
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
        club: club || null,
        swingScore: score?.total ?? null,
        cameraAngle: cameraAngle || null,
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
          <p className="save-bar-title">Swing bewaard</p>
          <p className="save-bar-sub">Je vindt hem terug in je Player Hub.</p>
        </div>
        <button type="button" className="phase-button" onClick={() => onNavigate("history")}>
          Naar Player Hub
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
            <Icon name="alert" size={15} />
            {error}
          </p>
        )}
      </div>

      <div className="save-bar-controls">
        {score && (
          <div className="save-score" title="Houdingsscore uit kniebuiging en rughoek">
            <span className="save-score-value">{score.total}</span>
            <span className="save-score-label">Score</span>
          </div>
        )}

        <label className="save-club">
          <span className="field-label">Club</span>
          <select
            className="field-input club-select"
            value={club}
            onChange={(e) => setClub(e.target.value)}
          >
            <option value="">Onbekend</option>
            {CLUB_GROUPS.map((group) => (
              <optgroup key={group.group} label={group.group}>
                {group.clubs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="btn-primary"
          onClick={handleSave}
          disabled={status === "saving"}
        >
          {status === "saving" ? "Opslaan" : "Bewaar deze swing"}
        </button>
      </div>
    </div>
  );
}
