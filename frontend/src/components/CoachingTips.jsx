const CATEGORY_ICONS = {
  backswing: "🏌️",
  balans: "⚖️",
  "follow-through": "🎯",
};

function iconFor(category) {
  return CATEGORY_ICONS[category?.toLowerCase()] ?? "💡";
}

export default function CoachingTips({ tips, hasVideo }) {
  if (!hasVideo) {
    return (
      <div className="tips-placeholder">
        <div className="tips-placeholder-icon">🤖</div>
        <p>Zodra je een swing uploadt, verschijnen hier je AI-coaching tips.</p>
      </div>
    );
  }

  if (!tips || tips.length === 0) {
    return (
      <div className="tips-placeholder">
        <p>Je swing wordt geanalyseerd…</p>
      </div>
    );
  }

  return (
    <ul className="tips-list">
      {tips.map((tip, index) => (
        <li className="tip-card" key={index} style={{ animationDelay: `${index * 80}ms` }}>
          <span className="tip-icon">{iconFor(tip.category)}</span>
          <div>
            <span className="tip-category">{tip.category}</span>
            <p>{tip.tip}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
