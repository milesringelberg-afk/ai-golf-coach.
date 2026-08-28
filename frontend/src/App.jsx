import { useRef, useState } from "react";
import NavRail from "./components/NavRail.jsx";
import Dashboard from "./components/Dashboard.jsx";
import StatsView from "./components/StatsView.jsx";
import InfoView from "./components/InfoView.jsx";
import "./App.css";

const VIEW_TITLES = {
  swing: { title: "Swing analyseren", sub: "Upload je swing en bekijk de herkende houding" },
  stats: { title: "Stats", sub: "Gemeten hoeken uit je laatste swing" },
  info: { title: "Info", sub: "Hoe deze analyse tot stand komt" },
};

export default function App() {
  const [activeView, setActiveView] = useState("swing");

  const videoRef = useRef(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [coachingTips, setCoachingTips] = useState([]);
  const [liveMetrics, setLiveMetrics] = useState(null);
  const [phases, setPhases] = useState(null);
  const [addressPosture, setAddressPosture] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const heading = VIEW_TITLES[activeView];

  return (
    <div className="app-shell">
      <NavRail activeView={activeView} onNavigate={setActiveView} hasVideo={Boolean(videoUrl)} />

      <main className="app-content">
        <header className="content-header">
          <div>
            <h1>{heading.title}</h1>
            <p>{heading.sub}</p>
          </div>
        </header>

        {/* De swing-weergave blijft gemonteerd zodat video en pose-analyse
            niet resetten wanneer je even naar Stats of Info kijkt. */}
        <div className={`view ${activeView === "swing" ? "" : "view-hidden"}`}>
          <Dashboard
            videoRef={videoRef}
            videoUrl={videoUrl}
            setVideoUrl={setVideoUrl}
            coachingTips={coachingTips}
            setCoachingTips={setCoachingTips}
            liveMetrics={liveMetrics}
            setLiveMetrics={setLiveMetrics}
            phases={phases}
            setPhases={setPhases}
            addressPosture={addressPosture}
            setAddressPosture={setAddressPosture}
            isAnalyzing={isAnalyzing}
            setIsAnalyzing={setIsAnalyzing}
            voiceEnabled={voiceEnabled}
            setVoiceEnabled={setVoiceEnabled}
          />
        </div>

        {activeView === "stats" && (
          <div className="view">
            <StatsView
              addressPosture={addressPosture}
              liveMetrics={liveMetrics}
              onNavigate={setActiveView}
            />
          </div>
        )}

        {activeView === "info" && (
          <div className="view">
            <InfoView />
          </div>
        )}
      </main>
    </div>
  );
}
