import VideoUploader from "./VideoUploader.jsx";
import VideoPlayer from "./VideoPlayer.jsx";
import AnalysisPanel from "./AnalysisPanel.jsx";
import { speak, stopSpeaking } from "../lib/speech.js";

function StepHeading({ step, children }) {
  return (
    <h2 className="step-heading">
      <span className="step-badge">{step}</span>
      {children}
    </h2>
  );
}

export default function Dashboard({
  videoRef,
  videoUrl,
  setVideoUrl,
  coachingTips,
  setCoachingTips,
  liveMetrics,
  setLiveMetrics,
  phases,
  setPhases,
  addressPosture,
  setAddressPosture,
  isAnalyzing,
  setIsAnalyzing,
  voiceEnabled,
  setVoiceEnabled,
}) {
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
          onVideoSelected={(previewUrl) => {
            stopSpeaking();
            setVideoUrl(previewUrl);
            setCoachingTips([]);
            setIsAnalyzing(true);
          }}
          onUploaded={({ url, tips }) => {
            setVideoUrl(url);
            setCoachingTips(tips);
            setIsAnalyzing(false);
            if (voiceEnabled && tips?.[0]?.tip) {
              speak(tips[0].tip);
            }
          }}
          onUploadFailed={() => {
            setVideoUrl(null);
            setIsAnalyzing(false);
          }}
        />
      </section>

      <div className="analyzer-grid">
        <section className="panel panel-video">
          <StepHeading step={2}>Bekijk je swing</StepHeading>
          <VideoPlayer
            videoUrl={videoUrl}
            videoRef={videoRef}
            isAnalyzing={isAnalyzing}
            onLiveMetrics={setLiveMetrics}
            onPhases={setPhases}
            onAddressPosture={setAddressPosture}
          />
        </section>

        <section className="panel panel-analysis">
          <StepHeading step={3}>AI Analyse</StepHeading>
          <AnalysisPanel
            hasVideo={Boolean(videoUrl)}
            coachingTips={coachingTips}
            liveMetrics={liveMetrics}
            phases={phases}
            addressPosture={addressPosture}
            onSeek={seekTo}
            voiceEnabled={voiceEnabled}
            onToggleVoice={setVoiceEnabled}
          />
        </section>
      </div>
    </div>
  );
}
