import { useEffect, useRef, useState } from "react";
import { PoseLandmarker, DrawingUtils } from "@mediapipe/tasks-vision";
import { getPoseLandmarker } from "../lib/poseLandmarker.js";

export default function VideoPlayer({ videoUrl }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [overlayEnabled, setOverlayEnabled] = useState(true);
  const [modelStatus, setModelStatus] = useState("idle"); // idle | loading | ready | error

  useEffect(() => {
    if (!videoUrl || !overlayEnabled) return;

    let cancelled = false;
    let frameHandle = null;
    const video = videoRef.current;

    async function start() {
      setModelStatus("loading");
      let landmarker;
      try {
        landmarker = await getPoseLandmarker();
      } catch (err) {
        console.error("Kon pose-model niet laden:", err);
        if (!cancelled) setModelStatus("error");
        return;
      }
      if (cancelled) return;
      setModelStatus("ready");

      const canvas = canvasRef.current;
      if (!video || !canvas) return;
      const ctx = canvas.getContext("2d");
      const drawingUtils = new DrawingUtils(ctx);

      function renderFrame() {
        if (cancelled || !videoRef.current || !canvasRef.current) return;
        const v = videoRef.current;
        const c = canvasRef.current;

        if (v.videoWidth && (c.width !== v.videoWidth || c.height !== v.videoHeight)) {
          c.width = v.videoWidth;
          c.height = v.videoHeight;
        }

        if (!v.paused && !v.ended && v.videoWidth) {
          const result = landmarker.detectForVideo(v, performance.now());
          ctx.clearRect(0, 0, c.width, c.height);
          for (const landmarks of result.landmarks) {
            drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, {
              color: "#4ade80",
              lineWidth: 3,
            });
            drawingUtils.drawLandmarks(landmarks, {
              radius: 3,
              color: "#eef4ef",
              fillColor: "#4ade80",
            });
          }
        }

        frameHandle = v.requestVideoFrameCallback
          ? v.requestVideoFrameCallback(renderFrame)
          : requestAnimationFrame(renderFrame);
      }

      frameHandle = video.requestVideoFrameCallback
        ? video.requestVideoFrameCallback(renderFrame)
        : requestAnimationFrame(renderFrame);
    }

    start();

    return () => {
      cancelled = true;
      if (frameHandle != null) {
        if (video?.cancelVideoFrameCallback) {
          video.cancelVideoFrameCallback(frameHandle);
        } else {
          cancelAnimationFrame(frameHandle);
        }
      }
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
      }
    };
  }, [videoUrl, overlayEnabled]);

  if (!videoUrl) {
    return (
      <div className="video-placeholder">
        <div className="video-placeholder-icon">📹</div>
        <p>Upload een video om deze hier te bekijken</p>
      </div>
    );
  }

  return (
    <div>
      <div className="video-wrapper">
        <video
          ref={videoRef}
          className="video-player"
          src={videoUrl}
          controls
          playsInline
          key={videoUrl}
        >
          Je browser ondersteunt geen video-weergave.
        </video>
        <canvas ref={canvasRef} className="pose-overlay-canvas" />
      </div>
      <label className="overlay-toggle">
        <input
          type="checkbox"
          checked={overlayEnabled}
          onChange={(e) => setOverlayEnabled(e.target.checked)}
        />
        Lichaamshouding tonen
        {modelStatus === "loading" && " — model laden…"}
        {modelStatus === "error" && " — analyse kon niet geladen worden"}
      </label>
    </div>
  );
}
