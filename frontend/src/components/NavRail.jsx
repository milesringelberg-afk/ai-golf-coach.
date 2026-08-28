import Icon from "./Icon.jsx";

const NAV_ITEMS = [
  { id: "swing", label: "Swing", icon: "swing", hint: "Upload & analyseer" },
  { id: "stats", label: "Stats", icon: "stats", hint: "Gemeten hoeken" },
  { id: "history", label: "Hub", icon: "history", hint: "Bewaarde swings" },
  { id: "info", label: "Info", icon: "info", hint: "Hoe het werkt" },
];

export default function NavRail({ activeView, onNavigate, hasVideo, session, onSignOut }) {
  return (
    <nav className="nav-rail" aria-label="Hoofdnavigatie">
      <div className="nav-brand">
        <span className="nav-logo">
          <Icon name="swing" size={20} />
        </span>
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
              <Icon name={item.icon} size={17} className="nav-item-icon" />
              <span className="nav-item-body">
                <span className="nav-item-label">{item.label}</span>
                <span className="nav-item-hint">{item.hint}</span>
              </span>
              {item.id === "stats" && hasVideo && <span className="nav-dot" aria-hidden="true" />}
            </button>
          </li>
        ))}

        {/* Account krijgt op mobiel dezelfde plek in de balk als de rest. */}
        <li className="nav-account-mobile">
          <button
            type="button"
            className={`nav-item ${activeView === "account" ? "nav-item-active" : ""}`}
            onClick={() => onNavigate("account")}
            aria-current={activeView === "account" ? "page" : undefined}
          >
            <Icon name={session ? "user" : "key"} size={17} className="nav-item-icon" />
            <span className="nav-item-body">
              <span className="nav-item-label">Account</span>
            </span>
          </button>
        </li>
      </ul>

      <div className="nav-account">
        {session ? (
          <>
            <p className="nav-account-email" title={session.user.email}>
              {session.user.email}
            </p>
            <button type="button" className="nav-signout" onClick={onSignOut}>
              Uitloggen
            </button>
          </>
        ) : (
          <button
            type="button"
            className={`nav-item nav-item-login ${
              activeView === "account" ? "nav-item-active" : ""
            }`}
            onClick={() => onNavigate("account")}
          >
            <Icon name="key" size={17} className="nav-item-icon" />
            <span className="nav-item-body">
              <span className="nav-item-label">Inloggen</span>
              <span className="nav-item-hint">Bewaar je swings</span>
            </span>
          </button>
        )}
      </div>
    </nav>
  );
}
