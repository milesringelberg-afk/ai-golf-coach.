import VideoUploader from "./VideoUploader.jsx";
import VideoPlayer from "./VideoPlayer.jsx";
import CoachingTips from "./CoachingTips.jsx";

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

      <section className="panel panel-video">
        <StepHeading step={2}>Bekijk je swing</StepHeading>
        <VideoPlayer videoUrl={videoUrl} />
      </section>

      <section className="panel panel-tips">
        <StepHeading step={3}>AI Coaching tips</StepHeading>
        <CoachingTips tips={coachingTips} hasVideo={Boolean(videoUrl)} />
      </section>
    </div>
  );
}
