import { clubLabel } from "../lib/clubs.js";
import { angleLabel } from "../lib/cameraAngles.js";

const ROWS = [
  { key: "swing_score", label: "Score", unit: "" },
  { key: "knee_flex", label: "Kniebuiging", unit: "°" },
  { key: "spine_angle", label: "Rughoek", unit: "°" },
  { key: "shoulder_rotation", label: "Schouders", unit: "°" },
  { key: "hip_rotation", label: "Heupen", unit: "°" },
  { key: "x_factor", label: "X-factor", unit: "°" },
];

function fmt(value, unit) {
  if (value == null) return "–";
  return `${Math.round(value)}${unit}`;
}

function shortDate(iso) {
  return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
}

function heading(a) {
  return [clubLabel(a.club), angleLabel(a.camera_angle), shortDate(a.created_at)]
    .filter(Boolean)
    .join(" · ");
}

export default function CompareStrip({ left, right, onClear }) {
  return (
    <section className="compare-strip">
      <div className="compare-head">
        <h2 className="section-title">Vergelijking</h2>
        <button type="button" className="link-button" onClick={onClear}>
          Selectie wissen
        </button>
      </div>

      <div className="compare-table">
        <div className="compare-row compare-row-head">
          <span className="compare-label" />
          <span className="compare-value">{heading(left)}</span>
          <span className="compare-value">{heading(right)}</span>
          <span className="compare-delta">Verschil</span>
        </div>

        {ROWS.map((row) => {
          const a = left[row.key];
          const b = right[row.key];
          const delta = a != null && b != null ? Math.round(b - a) : null;
          return (
            <div className="compare-row" key={row.key}>
              <span className="compare-label">{row.label}</span>
              <span className="compare-value">{fmt(a, row.unit)}</span>
              <span className="compare-value">{fmt(b, row.unit)}</span>
              <span
                className={`compare-delta ${
                  delta == null || delta === 0 ? "" : delta > 0 ? "delta-up" : "delta-down"
                }`}
              >
                {delta == null ? "–" : delta === 0 ? "0" : `${delta > 0 ? "+" : ""}${delta}`}
              </span>
            </div>
          );
        })}
      </div>

      <p className="stats-disclaimer">
        Het verschil is simpelweg rechts min links. Of een hogere waarde beter is, hangt af van de
        meting — de app spreekt daar geen oordeel over uit.
      </p>
    </section>
  );
}
