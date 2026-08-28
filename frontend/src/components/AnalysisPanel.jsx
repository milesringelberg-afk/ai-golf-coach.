import { useState } from "react";
import { speak, isSpeechSupported } from "../lib/speech.js";
import { getPostureHints } from "../lib/postureHints.js";

const CATEGORY_ICONS = {
  backswing: "🏌️",
  balans: "⚖️",
  "follow-through": "🎯",
};

function iconFor(category) {
  return CATEGORY_ICONS[category?.toLowerCase()] ?? "💡";
}

const PHASE_LABELS = {
  address: "Address",
  top: "Top backswing",
  impact: "Impact",
  finish: "Finish",
};

const TABS = [
  { id: "analyse", label: "AI Analyse", icon: "🧠" },
  { id: "verbeterpunten", label: "Verbeterpunten", icon: "💡" },
  { id: "stats", label: "Stats", icon: "📊" },
];

function simplifyPhases(phases) {
  if (!phases) return null;
  return Object.fromEntries(Object.entries(phases).map(([key, frame]) => [key, { t: frame.t }]));
}

export default function AnalysisPanel({
  hasVideo,
  coachingTips,
  liveMetrics,
  phases,
  addressPosture,
  onSeek,
  voiceEnabled,
  onToggleVoice,
}) {
  const [activeTab, setActiveTab] = useState("analyse");
  const [coachStatus, setCoachStatus] = useState("idle"); // idle | loading | done | error
  const [coachResult, setCoachResult] = useState(null);
  const [coachError, setCoachError] = useState(null);
  const postureHints = getPostureHints(addressPosture);

  async function requestDeepAnalysis() {
    setCoachStatus("loading");
    setCoachError(null);
    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressPosture,
          rotation: liveMetrics,
          phases: simplifyPhases(phases),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "AI-analyse is mislukt.");
      }
      setCoachResult(data.analysis);
      setCoachStatus("done");
    } catch (err) {
      setCoachError(err.message || "Er ging iets mis.");
      setCoachStatus("error");
    }
  }

  if (!hasVideo) {
    return (
      <div className="tips-placeholder">
        <div className="tips-placeholder-icon">🤖</div>
        <p>Zodra je een swing uploadt, verschijnt hier de AI-analyse.</p>
      </div>
    );
  }

  return (
    <div className="analysis-panel">
      {isSpeechSupported() && (
        <label className="overlay-toggle voice-toggle">
          <input
            type="checkbox"
            checked={voiceEnabled}
            onChange={(e) => onToggleVoice(e.target.checked)}
          />
          🔊 Spreek belangrijkste tip uit
        </label>
      )}

      <div className="tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tab-button ${activeTab === tab.id ? "tab-button-active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-content" key={activeTab}>
        {activeTab === "analyse" && (
          <>
            <div className="posture-section">
              <p className="posture-section-title">Beginhouding (address)</p>
              {addressPosture ? (
                postureHints.length > 0 ? (
                  <ul className="posture-hints">
                    {postureHints.map((hint) => (
                      <li className="posture-hint" key={hint.label}>
                        <span className="posture-hint-label">{hint.label}</span>
                        <p>{hint.text}</p>
                        <p className="posture-hint-drill">{hint.drill}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="tab-hint">
                    Sterke basis — je kniebuiging en rughoek bij address vallen binnen een gezonde
                    richtlijn.
                  </p>
                )
              ) : (
                <p className="tab-hint">
                  Speel de video af met "Lichaamshouding tonen" aan — de eerste seconde wordt
                  gebruikt als je address-positie.
                </p>
              )}
              <p className="posture-disclaimer">
                Vuistregel op basis van eenvoudige hoekmeting, geen gepersonaliseerd coach-advies.
              </p>
            </div>

            {phases ? (
              <>
                <p className="tab-hint">Herkende swingfases — klik om dat moment te bekijken:</p>
                <div className="phase-markers-buttons">
                  {Object.entries(phases).map(([key, frame]) => (
                    <button
                      key={key}
                      type="button"
                      className="phase-button"
                      onClick={() => onSeek(frame.t)}
                    >
                      {PHASE_LABELS[key]}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p className="tab-hint">
                Speel de video eenmaal volledig af met "Lichaamshouding tonen" aan — dan herkent de
                AI automatisch de swingfases (address, top, impact, finish).
              </p>
            )}

            <div className="deep-coach-section">
              <p className="posture-section-title">Master PGA Coach (Claude API)</p>
              {coachStatus === "idle" && (
                <>
                  <p className="tab-hint">
                    Vraag een diepgaande analyse aan: root cause + drie oplossingsrichtingen
                    (gevoel, hulpmiddel, mentale gedachte), gebaseerd op de gemeten hoeken hierboven.
                  </p>
                  <button
                    type="button"
                    className="phase-button deep-coach-btn"
                    onClick={requestDeepAnalysis}
                    disabled={!addressPosture && !liveMetrics}
                  >
                    🧠 Vraag diepgaande analyse aan
                  </button>
                </>
              )}
              {coachStatus === "loading" && (
                <p className="tab-hint">De Master PGA Coach denkt na over je swing…</p>
              )}
              {coachStatus === "error" && (
                <>
                  <p className="alert-chip alert-chip-error">
                    <span>⚠️</span> {coachError}
                  </p>
                  <button
                    type="button"
                    className="phase-button deep-coach-btn"
                    onClick={requestDeepAnalysis}
                  >
                    Opnieuw proberen
                  </button>
                </>
              )}
              {coachStatus === "done" && <div className="deep-coach-result">{coachResult}</div>}
            </div>
          </>
        )}

        {activeTab === "verbeterpunten" &&
          (!coachingTips || coachingTips.length === 0 ? (
            <p className="tab-hint">Je swing wordt geanalyseerd…</p>
          ) : (
            <ul className="tips-list">
              {coachingTips.map((tip, index) => (
                <li className="tip-card" key={index} style={{ animationDelay: `${index * 80}ms` }}>
                  <span className="tip-icon">{iconFor(tip.category)}</span>
                  <div className="tip-card-body">
                    <span className="tip-category">{tip.category}</span>
                    <p>{tip.tip}</p>
                  </div>
                  {isSpeechSupported() && (
                    <button
                      type="button"
                      className="tip-speak-btn"
                      onClick={() => speak(tip.tip)}
                      aria-label="Lees deze tip voor"
                    >
                      🔊
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ))}

        {activeTab === "stats" &&
          (liveMetrics || addressPosture ? (
            <>
              {addressPosture && (
                <>
                  <p className="stats-group-title">Bij address</p>
                  <div className="swing-stats">
                    <div className="swing-stat">
                      <span className="swing-stat-value">
                        {Math.round(addressPosture.kneeFlex)}°
                      </span>
                      <span className="swing-stat-label">Kniebuiging</span>
                    </div>
                    <div className="swing-stat">
                      <span className="swing-stat-value">
                        {Math.round(addressPosture.spineAngle)}°
                      </span>
                      <span className="swing-stat-label">Rughoek</span>
                    </div>
                  </div>
                </>
              )}
              {liveMetrics && (
                <>
                  <p className="stats-group-title">Tijdens de swing</p>
                  <div className="swing-stats">
                    <div className="swing-stat">
                      <span className="swing-stat-value">
                        {Math.round(liveMetrics.shoulderRotation)}°
                      </span>
                      <span className="swing-stat-label">Schouderdraaiing</span>
                    </div>
                    <div className="swing-stat">
                      <span className="swing-stat-value">{Math.round(liveMetrics.hipRotation)}°</span>
                      <span className="swing-stat-label">Heupdraaiing</span>
                    </div>
                    <div className="swing-stat">
                      <span className="swing-stat-value">{Math.round(liveMetrics.xFactor)}°</span>
                      <span className="swing-stat-label">X-factor</span>
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <p className="tab-hint">
              Speel de video af met "Lichaamshouding tonen" aan om live statistieken te zien.
            </p>
          ))}
      </div>
    </div>
  );
}
