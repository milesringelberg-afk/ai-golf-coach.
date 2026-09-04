import VideoUploader from "./VideoUploader.jsx";
import VideoPlayer from "./VideoPlayer.jsx";
import AnalysisPanel from "./AnalysisPanel.jsx";
import SaveSwingBar from "./SaveSwingBar.jsx";
import { isSupabaseConfigured } from "../lib/supabase.js";
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
  videoFile,
  setVideoFile,
  coachingTips,
  setCoachingTips,
  liveMetrics,
  setLiveMetrics,
  phases,
  setPhases,
  addressPosture,
  setAddressPosture,
  coachText,
  setCoachText,
  cameraAngle,
  setCameraAngle,
  isAnalyzing,
  setIsAnalyzing,
  voiceEnabled,
  setVoiceEnabled,
  session,
  onNavigate,
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
          onVideoSelected={(previewUrl, file) => {
            stopSpeaking();
            setVideoUrl(previewUrl);
            setVideoFile(file);
            setCoachingTips([]);
            setCoachText(null);
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
            setVideoFile(null);
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
            coachText={coachText}
            setCoachText={setCoachText}
            cameraAngle={cameraAngle}
            setCameraAngle={setCameraAngle}
            onSeek={seekTo}
            voiceEnabled={voiceEnabled}
            onToggleVoice={setVoiceEnabled}
          />
        </section>
      </div>

      {videoUrl && isSupabaseConfigured && (
        <SaveSwingBar
          session={session}
          videoFile={videoFile}
          addressPosture={addressPosture}
          liveMetrics={liveMetrics}
          phases={phases}
          coachText={coachText}
          cameraAngle={cameraAngle}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
}
