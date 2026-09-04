import { useEffect, useState } from "react";
import Icon from "./Icon.jsx";
import { speak, isSpeechSupported } from "../lib/speech.js";
import { getPostureHints } from "../lib/postureHints.js";
import { CAMERA_ANGLES, getAngleHints } from "../lib/cameraAngles.js";

const PHASE_LABELS = {
  address: "Address",
  top: "Top backswing",
  impact: "Impact",
  finish: "Finish",
};

// De losse Stats-tab is verhuisd naar de eigen "Stats"-weergave in de navigatie.
const TABS = [
  { id: "analyse", label: "AI Analyse", icon: "analysis" },
  { id: "verbeterpunten", label: "Verbeterpunten", icon: "bulb" },
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
  coachText,
  setCoachText,
  cameraAngle,
  setCameraAngle,
  onSeek,
  voiceEnabled,
  onToggleVoice,
}) {
  const [activeTab, setActiveTab] = useState("analyse");
  const [coachStatus, setCoachStatus] = useState("idle"); // idle | loading | done | error
  const [coachError, setCoachError] = useState(null);
  const [coachAvailable, setCoachAvailable] = useState(false);

  // Alleen tonen als de server een sleutel heeft: anders is het een knop
  // die met zekerheid een foutmelding oplevert.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/coach/status")
      .then((r) => (r.ok ? r.json() : { available: false }))
      .then((d) => {
        if (!cancelled) setCoachAvailable(Boolean(d.available));
      })
      .catch(() => {
        if (!cancelled) setCoachAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const postureHints = getPostureHints(addressPosture);
  const angleHints = getAngleHints({
    cameraAngle,
    maxSway: liveMetrics?.maxSway,
    maxSpineChange: liveMetrics?.maxSpineChange,
  });

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
      setCoachText(data.analysis);
      setCoachStatus("done");
    } catch (err) {
      setCoachError(err.message || "Er ging iets mis.");
      setCoachStatus("error");
    }
  }

  if (!hasVideo) {
    return (
      <div className="tips-placeholder">
        <Icon name="analysis" size={30} className="placeholder-icon" />
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
          <Icon name="sound" size={15} />
          Spreek belangrijkste tip uit
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
            <Icon name={tab.icon} size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-content" key={activeTab}>
        {activeTab === "analyse" && (
          <>
            <div className="posture-section">
              <p className="posture-section-title">Camerastand</p>
              <div className="angle-picker">
                {CAMERA_ANGLES.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className={`angle-option ${cameraAngle === a.id ? "angle-option-active" : ""}`}
                    onClick={() => setCameraAngle(cameraAngle === a.id ? "" : a.id)}
                  >
                    <span className="angle-option-label">{a.label}</span>
                    <span className="angle-option-hint">{a.hint}</span>
                  </button>
                ))}
              </div>

              {cameraAngle ? (
                angleHints.length > 0 ? (
                  <ul className="posture-hints angle-hints">
                    {angleHints.map((hint) => (
                      <li className="posture-hint" key={hint.label}>
                        <span className="posture-hint-label">{hint.label}</span>
                        <p>{hint.text}</p>
                        {hint.drill && <p className="posture-hint-drill">{hint.drill}</p>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="tab-hint angle-hints">
                    Speel de video af met "Lichaamshouding tonen" aan, dan verschijnt hier de
                    feedback die bij deze camerastand hoort.
                  </p>
                )
              ) : (
                <p className="tab-hint angle-hints">
                  Kies hoe je gefilmd bent. Van voren meet de app je zijwaartse heupbeweging, van
                  achteren of je je rughoek vasthoudt — dezelfde cijfers betekenen per stand iets
                  anders.
                </p>
              )}
            </div>

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

            {coachAvailable && (
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
                    Vraag diepgaande analyse aan
                  </button>
                </>
              )}
              {coachStatus === "loading" && (
                <p className="tab-hint">De Master PGA Coach denkt na over je swing</p>
              )}
              {coachStatus === "error" && (
                <>
                  <p className="alert-chip alert-chip-error">
                    <Icon name="alert" size={15} />
                    {coachError}
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
              {coachStatus === "done" && <div className="deep-coach-result">{coachText}</div>}
            </div>
            )}
          </>
        )}

        {activeTab === "verbeterpunten" &&
          (!coachingTips || coachingTips.length === 0 ? (
            <p className="tab-hint">Je swing wordt geanalyseerd</p>
          ) : (
            <ul className="tips-list">
              {coachingTips.map((tip, index) => (
                <li className="tip-card" key={index} style={{ animationDelay: `${index * 80}ms` }}>
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
                      <Icon name="sound" size={15} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ))}

      </div>
    </div>
  );
}
