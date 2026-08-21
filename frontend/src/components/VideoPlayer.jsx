export default function VideoPlayer({ videoUrl }) {
  if (!videoUrl) {
    return (
      <div className="video-placeholder">
        <div className="video-placeholder-icon">📹</div>
        <p>Upload een video om deze hier te bekijken</p>
      </div>
    );
  }

  return (
    <video className="video-player" src={videoUrl} controls key={videoUrl}>
      Je browser ondersteunt geen video-weergave.
    </video>
  );
}
