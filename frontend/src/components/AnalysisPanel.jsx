import { useState } from "react";
import { speak, isSpeechSupported } from "../lib/speech.js";

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

export default function AnalysisPanel({
  hasVideo,
  coachingTips,
  liveMetrics,
  phases,
  onSeek,
  voiceEnabled,
  onToggleVoice,
}) {
  const [activeTab, setActiveTab] = useState("analyse");

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
        {activeTab === "analyse" &&
          (phases ? (
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
          ))}

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
          (liveMetrics ? (
            <div className="swing-stats">
              <div className="swing-stat">
                <span className="swing-stat-value">{Math.round(liveMetrics.shoulderRotation)}°</span>
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
          ) : (
            <p className="tab-hint">
              Speel de video af met "Lichaamshouding tonen" aan om live statistieken te zien.
            </p>
          ))}
      </div>
    </div>
  );
}
