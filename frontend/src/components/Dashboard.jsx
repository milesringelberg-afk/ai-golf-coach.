import VideoUploader from "./VideoUploader.jsx";
import VideoPlayer from "./VideoPlayer.jsx";
import CoachingTips from "./CoachingTips.jsx";

export default function Dashboard({
  videoUrl,
  setVideoUrl,
  coachingTips,
  setCoachingTips,
}) {
  return (
    <div className="dashboard">
      <section className="panel panel-upload">
        <h2>1. Swing uploaden</h2>
        <VideoUploader
          onUploaded={({ url, tips }) => {
            setVideoUrl(url);
            setCoachingTips(tips);
          }}
        />
      </section>

      <section className="panel panel-video">
        <h2>2. Bekijk je swing</h2>
        <VideoPlayer videoUrl={videoUrl} />
      </section>

      <section className="panel panel-tips">
        <h2>3. AI Coaching tips</h2>
        <CoachingTips tips={coachingTips} hasVideo={Boolean(videoUrl)} />
      </section>
    </div>
  );
}
