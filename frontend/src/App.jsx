import { useEffect, useRef, useState } from "react";
import NavRail from "./components/NavRail.jsx";
import Dashboard from "./components/Dashboard.jsx";
import StatsView from "./components/StatsView.jsx";
import InfoView from "./components/InfoView.jsx";
import AuthScreen from "./components/AuthScreen.jsx";
import HistoryView from "./components/HistoryView.jsx";
import UpgradeGuestForm from "./components/UpgradeGuestForm.jsx";
import GameView from "./components/GameView.jsx";
import Icon from "./components/Icon.jsx";
import { supabase, isSupabaseConfigured } from "./lib/supabase.js";
import "./App.css";

const VIEW_TITLES = {
  swing: { title: "Swing analyseren", sub: "Upload je swing en bekijk de herkende houding" },
  stats: { title: "Stats", sub: "Gemeten hoeken uit je laatste swing" },
  history: { title: "Player Hub", sub: "Je bewaarde swings, club en houdingsscore" },
  game: { title: "Minigolf", sub: "Sleep om te richten, laat los om te slaan" },
  info: { title: "Info", sub: "Hoe deze analyse tot stand komt" },
  account: { title: "Player Hub", sub: "Inloggen om je swings te bewaren" },
};

export default function App() {
  const [activeView, setActiveView] = useState("swing");
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);

  const videoRef = useRef(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [coachingTips, setCoachingTips] = useState([]);
  const [liveMetrics, setLiveMetrics] = useState(null);
  const [phases, setPhases] = useState(null);
  const [addressPosture, setAddressPosture] = useState(null);
  const [coachText, setCoachText] = useState(null);
  const [cameraAngle, setCameraAngle] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // Bestaande sessie herstellen en op wijzigingen luisteren.
  useEffect(() => {
    if (!supabase) return;

    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session ?? null);
      setAuthReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  // Na inloggen vanaf het accountscherm meteen door naar de historie.
  useEffect(() => {
    if (session && activeView === "account") {
      setActiveView("history");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  async function handleSignOut() {
    await supabase?.auth.signOut();
    setActiveView("swing");
  }

  // Valt terug op de swing-weergave: een onbekende naam mag nooit tot een
  // leeg scherm leiden.
  const heading = VIEW_TITLES[activeView] ?? VIEW_TITLES.swing;

  return (
    <div className="app-shell">
      <NavRail
        activeView={activeView}
        onNavigate={setActiveView}
        hasVideo={Boolean(videoUrl)}
        session={session}
        onSignOut={handleSignOut}
      />

      <main className="app-content">
        <header className="content-header">
          <div>
            <h1>{heading.title}</h1>
            <p>{heading.sub}</p>
          </div>
        </header>

        {/* De swing-weergave blijft gemonteerd zodat video en pose-analyse
            niet resetten wanneer je even naar een andere weergave kijkt. */}
        <div className={`view ${activeView === "swing" ? "" : "view-hidden"}`}>
          <Dashboard
            videoRef={videoRef}
            videoUrl={videoUrl}
            setVideoUrl={setVideoUrl}
            videoFile={videoFile}
            setVideoFile={setVideoFile}
            coachingTips={coachingTips}
            setCoachingTips={setCoachingTips}
            liveMetrics={liveMetrics}
            setLiveMetrics={setLiveMetrics}
            phases={phases}
            setPhases={setPhases}
            addressPosture={addressPosture}
            setAddressPosture={setAddressPosture}
            coachText={coachText}
            setCoachText={setCoachText}
            cameraAngle={cameraAngle}
            setCameraAngle={setCameraAngle}
            isAnalyzing={isAnalyzing}
            setIsAnalyzing={setIsAnalyzing}
            voiceEnabled={voiceEnabled}
            setVoiceEnabled={setVoiceEnabled}
            session={session}
            onNavigate={setActiveView}
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

        {activeView === "history" && (
          <div className="view">
            {!authReady ? (
              <p className="tab-hint">Even geduld</p>
            ) : session ? (
              <HistoryView onNavigate={setActiveView} />
            ) : (
              <AuthScreen />
            )}
          </div>
        )}

        {activeView === "account" && (
          <div className="view">
            {!authReady ? (
              <p className="tab-hint">Even geduld</p>
            ) : session ? (
              <div className="view-empty">
                <Icon name="user" size={32} className="view-empty-icon" />
                <h2>{session.user.is_anonymous ? "Als gast bezig" : "Ingelogd"}</h2>
                {session.user.is_anonymous ? (
                  <>
                    <p>
                      Je gebruikt de Player Hub als gast. Je swings staan alleen in deze browser op
                      dit apparaat — wis je je browsergegevens, dan zijn ze weg.
                    </p>
                    <UpgradeGuestForm />
                  </>
                ) : (
                  <p>
                    Je bent ingelogd als <strong>{session.user.email}</strong>.
                  </p>
                )}
                <button type="button" className="btn-primary" onClick={handleSignOut}>
                  Uitloggen
                </button>
              </div>
            ) : (
              <AuthScreen />
            )}
          </div>
        )}

        {activeView === "game" && (
          <div className="view">
            <GameView />
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
