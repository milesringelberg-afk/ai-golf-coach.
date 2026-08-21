import { useEffect, useRef, useState } from "react";
import { PoseLandmarker, DrawingUtils } from "@mediapipe/tasks-vision";
import { getPoseLandmarker } from "../lib/poseLandmarker.js";
import {
  computeFrameAngles,
  computeLiveMetrics,
  computeWristSpeed,
  detectPhases,
} from "../lib/swingMetrics.js";

const PHASE_LABELS = {
  address: "Address",
  top: "Top backswing",
  impact: "Impact",
  finish: "Finish",
};

export default function VideoPlayer({ videoUrl }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [overlayEnabled, setOverlayEnabled] = useState(true);
  const [modelStatus, setModelStatus] = useState("idle"); // idle | loading | ready | error
  const [liveMetrics, setLiveMetrics] = useState(null);
  const [phases, setPhases] = useState(null);

  useEffect(() => {
    setLiveMetrics(null);
    setPhases(null);

    if (!videoUrl || !overlayEnabled) return;

    let cancelled = false;
    let frameHandle = null;
    const video = videoRef.current;

    const framesRef = { current: [] };
    const baselineRef = { current: null };
    const lastUiUpdateRef = { current: 0 };

    function handleEnded() {
      const detected = detectPhases(framesRef.current);
      if (detected) setPhases(detected);
    }

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
      video.addEventListener("ended", handleEnded);

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

          const landmarks = result.landmarks[0];
          if (landmarks) {
            drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, {
              color: "#4ade80",
              lineWidth: 3,
            });
            drawingUtils.drawLandmarks(landmarks, {
              radius: 3,
              color: "#eef4ef",
              fillColor: "#4ade80",
            });

            const frameAngles = computeFrameAngles(landmarks);
            if (!baselineRef.current) {
              baselineRef.current = {
                shoulderAngle: frameAngles.shoulderAngle,
                hipAngle: frameAngles.hipAngle,
              };
            }

            const prevFrame = framesRef.current[framesRef.current.length - 1];
            const speed = prevFrame
              ? computeWristSpeed(prevFrame.wristMid, prevFrame.t, frameAngles.wristMid, v.currentTime)
              : 0;

            framesRef.current.push({
              t: v.currentTime,
              wristMid: frameAngles.wristMid,
              shoulderAngle: frameAngles.shoulderAngle,
              hipAngle: frameAngles.hipAngle,
              speed,
            });

            const now = performance.now();
            if (now - lastUiUpdateRef.current > 120) {
              lastUiUpdateRef.current = now;
              setLiveMetrics(computeLiveMetrics(baselineRef.current, frameAngles));
            }
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
      video?.removeEventListener("ended", handleEnded);
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

  function seekTo(seconds) {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    v.currentTime = seconds;
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

      {overlayEnabled && liveMetrics && (
        <div className="swing-stats">
          <div className="swing-stat">
            <span className="swing-stat-value">{Math.round(liveMetrics.shoulderRotation)}°</span>
            <span className="swing-stat-label">Schouderdraaiing</span>
          </div>
          <div className="swing-stat">
            <span className="swing-stat-value">{Math.round(liveMetrics.hipRotation)}°</span>
            <span className="swing-stat-label">Heupdraaiing</span>
          </div>
          <div className="swing-stat">
            <span className="swing-stat-value">{Math.round(liveMetrics.xFactor)}°</span>
            <span className="swing-stat-label">X-factor</span>
          </div>
        </div>
      )}

      {overlayEnabled && phases && (
        <div className="phase-markers">
          <p className="phase-markers-title">Herkende swingfases (klik om te bekijken):</p>
          <div className="phase-markers-buttons">
            {Object.entries(phases).map(([key, frame]) => (
              <button
                key={key}
                type="button"
                className="phase-button"
                onClick={() => seekTo(frame.t)}
              >
                {PHASE_LABELS[key]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
