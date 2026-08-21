import { useState } from "react";
import Dashboard from "./components/Dashboard.jsx";
import "./App.css";

export default function App() {
  const [videoUrl, setVideoUrl] = useState(null);
  const [coachingTips, setCoachingTips] = useState([]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-brand">
            <span className="app-logo">⛳</span>
            <div>
              <div className="app-title-row">
                <h1>AI Golf Coach</h1>
                <span className="app-badge">Concept</span>
              </div>
              <p>Upload je swing en ontvang persoonlijke coaching tips</p>
            </div>
          </div>
        </div>
      </header>

      <main className="app-main">
        <Dashboard
          videoUrl={videoUrl}
          setVideoUrl={setVideoUrl}
          coachingTips={coachingTips}
          setCoachingTips={setCoachingTips}
        />
      </main>

      <footer className="app-footer">
        <p>AI Golf Coach — swing-analyse met live lichaamsherkenning</p>
      </footer>
    </div>
  );
}
