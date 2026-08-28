const NAV_ITEMS = [
  { id: "swing", label: "Swing", icon: "⛳", hint: "Upload & analyseer" },
  { id: "stats", label: "Stats", icon: "📊", hint: "Gemeten hoeken" },
  { id: "info", label: "Info", icon: "ℹ️", hint: "Hoe het werkt" },
];

export default function NavRail({ activeView, onNavigate, hasVideo }) {
  return (
    <nav className="nav-rail" aria-label="Hoofdnavigatie">
      <div className="nav-brand">
        <span className="nav-logo">⛳</span>
        <div className="nav-brand-text">
          <span className="nav-brand-name">Golf Coach</span>
          <span className="nav-brand-badge">Concept</span>
        </div>
      </div>

      <ul className="nav-list">
        {NAV_ITEMS.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className={`nav-item ${activeView === item.id ? "nav-item-active" : ""}`}
              onClick={() => onNavigate(item.id)}
              aria-current={activeView === item.id ? "page" : undefined}
            >
              <span className="nav-item-icon">{item.icon}</span>
              <span className="nav-item-body">
                <span className="nav-item-label">{item.label}</span>
                <span className="nav-item-hint">{item.hint}</span>
              </span>
              {item.id === "stats" && hasVideo && <span className="nav-dot" aria-hidden="true" />}
            </button>
          </li>
        ))}
      </ul>

      <p className="nav-footer">Live lichaamsherkenning in je browser</p>
    </nav>
  );
}
