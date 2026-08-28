import { useRef, useState } from "react";
import VideoUploader from "./VideoUploader.jsx";
import VideoPlayer from "./VideoPlayer.jsx";
import AnalysisPanel from "./AnalysisPanel.jsx";

function StepHeading({ step, children }) {
  return (
    <h2 className="step-heading">
      <span className="step-badge">{step}</span>
      {children}
    </h2>
  );
}

export default function Dashboard({
  videoUrl,
  setVideoUrl,
  coachingTips,
  setCoachingTips,
}) {
  const videoRef = useRef(null);
  const [liveMetrics, setLiveMetrics] = useState(null);
  const [phases, setPhases] = useState(null);

  function seekTo(seconds) {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    v.currentTime = seconds;
  }

  return (
    <div className="dashboard">
      <section className="panel panel-upload">
        <StepHeading step={1}>Swing uploaden</StepHeading>
        <VideoUploader
          onUploaded={({ url, tips }) => {
            setVideoUrl(url);
            setCoachingTips(tips);
          }}
        />
      </section>

      <div className="analyzer-grid">
        <section className="panel panel-video">
          <StepHeading step={2}>Bekijk je swing</StepHeading>
          <VideoPlayer
            videoUrl={videoUrl}
            videoRef={videoRef}
            onLiveMetrics={setLiveMetrics}
            onPhases={setPhases}
          />
        </section>

        <section className="panel panel-analysis">
          <StepHeading step={3}>AI Analyse</StepHeading>
          <AnalysisPanel
            hasVideo={Boolean(videoUrl)}
            coachingTips={coachingTips}
            liveMetrics={liveMetrics}
            phases={phases}
            onSeek={seekTo}
          />
        </section>
      </div>
    </div>
  );
}
