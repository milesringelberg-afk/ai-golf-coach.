import Icon from "./Icon.jsx";
import { POSTURE_RANGES } from "../lib/postureHints.js";
import { computeSwingScore, scoreBand } from "../lib/swingScore.js";

// `band` = grove richtlijn (alleen waar we die ook echt hebben vastgelegd).
// Voor de rotatiecijfers tonen we bewust géén band: daar hebben we geen
// onderbouwde "goede waarde" voor, dus dan zou een groene zone suggereren
// wat we niet weten.
const SCALE_MAX = {
  kneeFlex: 60,
  spineAngle: 70,
  shoulderRotation: 120,
  hipRotation: 80,
  xFactor: 70,
};

function ScoreCard({ label, value, scaleMax, band, caption, delay }) {
  const pct = Math.max(0, Math.min(100, (value / scaleMax) * 100));
  const inBand = band ? value >= band.min && value <= band.max : null;

  return (
    <article className="score-card" style={{ animationDelay: `${delay}ms` }}>
      <div className="score-card-top">
        <span className="score-label">{label}</span>
        {inBand !== null && (
          <span className={`score-flag ${inBand ? "score-flag-ok" : "score-flag-off"}`}>
            {inBand ? "binnen richtlijn" : "buiten richtlijn"}
          </span>
        )}
      </div>

      <div className="score-value">
        {Math.round(value)}
        <span className="score-unit">°</span>
      </div>

      <div className="score-track">
        {band && (
          <div
            className="score-band"
            style={{
              left: `${(band.min / scaleMax) * 100}%`,
              width: `${((band.max - band.min) / scaleMax) * 100}%`,
            }}
          />
        )}
        <div className="score-fill" style={{ width: `${pct}%` }} />
        <div className="score-marker" style={{ left: `${pct}%` }} />
      </div>

      <p className="score-caption">{caption}</p>
    </article>
  );
}

export default function StatsView({ addressPosture, liveMetrics, onNavigate }) {
  const hasAnything = addressPosture || liveMetrics;

  if (!hasAnything) {
    return (
      <div className="view-empty">
        <Icon name="stats" size={32} className="view-empty-icon" />
        <h2>Nog geen metingen</h2>
        <p>
          Upload een swing en speel de video af met "Lichaamshouding tonen" aan. De gemeten hoeken
          verschijnen dan hier.
        </p>
        <button type="button" className="btn-primary" onClick={() => onNavigate("swing")}>
          Naar swing uploaden
        </button>
      </div>
    );
  }

  const score = computeSwingScore(addressPosture);

  return (
    <div className="stats-view">
      {score && (
        <section className="stats-block">
          <h2 className="section-title">Houdingsscore</h2>
          <div className={`hero-score hero-score-${scoreBand(score.total)}`}>
            <div className="hero-score-main">
              <span className="hero-score-value">{score.total}</span>
              <span className="hero-score-max">/ 100</span>
            </div>
            <div className="hero-score-parts">
              {score.parts.map((part) => (
                <div className="hero-score-part" key={part.key}>
                  <span className="hero-score-part-label">{part.label}</span>
                  <span className="hero-score-part-value">{part.score}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="score-caption hero-score-note">
            Gemiddelde van de onderdelen hierboven. Meet hoe dicht je houding bij onze eigen
            richtlijnen ligt — niet of je swing golftechnisch goed is.
          </p>
        </section>
      )}

      {addressPosture && (
        <section className="stats-block">
          <h2 className="section-title">Beginhouding</h2>
          <div className="score-grid">
            <ScoreCard
              label="Kniebuiging"
              value={addressPosture.kneeFlex}
              scaleMax={SCALE_MAX.kneeFlex}
              band={POSTURE_RANGES.kneeFlex}
              caption={`Richtlijn ${POSTURE_RANGES.kneeFlex.min}–${POSTURE_RANGES.kneeFlex.max}°`}
              delay={0}
            />
            <ScoreCard
              label="Rughoek"
              value={addressPosture.spineAngle}
              scaleMax={SCALE_MAX.spineAngle}
              band={POSTURE_RANGES.spineAngle}
              caption={`Richtlijn ${POSTURE_RANGES.spineAngle.min}–${POSTURE_RANGES.spineAngle.max}° vanaf verticaal`}
              delay={60}
            />
          </div>
        </section>
      )}

      {liveMetrics && (
        <section className="stats-block">
          <h2 className="section-title">Rotatie tijdens de swing</h2>
          <div className="score-grid">
            <ScoreCard
              label="Schouderdraaiing"
              value={liveMetrics.shoulderRotation}
              scaleMax={SCALE_MAX.shoulderRotation}
              caption="Draaiing t.o.v. je startpositie"
              delay={0}
            />
            <ScoreCard
              label="Heupdraaiing"
              value={liveMetrics.hipRotation}
              scaleMax={SCALE_MAX.hipRotation}
              caption="Draaiing t.o.v. je startpositie"
              delay={60}
            />
            <ScoreCard
              label="X-factor"
              value={liveMetrics.xFactor}
              scaleMax={SCALE_MAX.xFactor}
              caption="Verschil tussen schouder- en heupdraaiing"
              delay={120}
            />
          </div>
        </section>
      )}

      <p className="stats-disclaimer">
        Alle waarden komen uit eenvoudige hoekmeting op de herkende lichaamspunten. De richtlijnen
        zijn grove vuistregels, geen sportwetenschappelijke norm. Voor de rotatiecijfers is bewust
        geen richtlijn ingesteld.
      </p>
    </div>
  );
}
