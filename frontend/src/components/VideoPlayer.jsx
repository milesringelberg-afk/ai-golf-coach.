import { useEffect, useRef, useState } from "react";
import { PoseLandmarker, DrawingUtils } from "@mediapipe/tasks-vision";
import Icon from "./Icon.jsx";
import { getPoseLandmarker } from "../lib/poseLandmarker.js";
import {
  computeFrameAngles,
  computeLiveMetrics,
  computeWristSpeed,
  computeAddressPosture,
  computeSway,
  computeSpineChange,
  detectPhases,
} from "../lib/swingMetrics.js";

function formatTime(t) {
  if (!isFinite(t) || t < 0) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export default function VideoPlayer({
  videoUrl,
  videoRef,
  isAnalyzing,
  onLiveMetrics,
  onPhases,
  onAddressPosture,
}) {
  const canvasRef = useRef(null);
  const [overlayEnabled, setOverlayEnabled] = useState(true);
  const [modelStatus, setModelStatus] = useState("idle"); // idle | loading | ready | error
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Pose-detectie: hoeken, snelheid en fases per frame berekenen.
  useEffect(() => {
    onLiveMetrics(null);
    onPhases(null);
    onAddressPosture(null);

    if (!videoUrl || !overlayEnabled) return;

    let cancelled = false;
    let frameHandle = null;
    const video = videoRef.current;

    const framesRef = { current: [] };
    const baselineRef = { current: null };
    const lastUiUpdateRef = { current: 0 };
    const extremesRef = { current: { maxSway: null, maxSpineChange: null } };

    function handleEnded() {
      const detected = detectPhases(framesRef.current);
      if (detected) onPhases(detected);
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
              color: "#ccff00",
              lineWidth: 3,
            });
            drawingUtils.drawLandmarks(landmarks, {
              radius: 3,
              color: "#fafafa",
              fillColor: "#ccff00",
            });

            const frameAngles = computeFrameAngles(landmarks);
            if (!baselineRef.current) {
              baselineRef.current = frameAngles;
              // Allereerste gedetecteerde frame = address: kniebuiging/rughoek hier vastleggen.
              onAddressPosture(computeAddressPosture(landmarks));
            }

            const prevFrame = framesRef.current[framesRef.current.length - 1];
            const speed = prevFrame
              ? computeWristSpeed(prevFrame.wristMid, prevFrame.t, frameAngles.wristMid, v.currentTime)
              : 0;

            // Grootste uitslag onthouden, niet de laatste: het gaat om hoe ver
            // je maximaal afwijkt tijdens de swing.
            const sway = computeSway(baselineRef.current, frameAngles);
            if (sway != null && Math.abs(sway) > Math.abs(extremesRef.current.maxSway ?? 0)) {
              extremesRef.current.maxSway = sway;
            }
            const spineChange = computeSpineChange(baselineRef.current, frameAngles);
            if (
              spineChange != null &&
              Math.abs(spineChange) > Math.abs(extremesRef.current.maxSpineChange ?? 0)
            ) {
              extremesRef.current.maxSpineChange = spineChange;
            }

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
              onLiveMetrics({
                ...computeLiveMetrics(baselineRef.current, frameAngles),
                maxSway: extremesRef.current.maxSway,
                maxSpineChange: extremesRef.current.maxSpineChange,
              });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoUrl, overlayEnabled]);

  // Custom tijdsbalk: play-state en voortgang bijhouden.
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !videoUrl) return;

    function onTime() {
      setCurrentTime(v.currentTime);
    }
    function onLoaded() {
      setDuration(v.duration || 0);
    }
    function onPlay() {
      setIsPlaying(true);
    }
    function onPause() {
      setIsPlaying(false);
    }

    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onLoaded);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
    };
  }, [videoUrl, videoRef]);

  if (!videoUrl) {
    return (
      <div className="video-placeholder">
        <Icon name="video" size={30} className="placeholder-icon" />
        <p>Upload een video om deze hier te bekijken</p>
      </div>
    );
  }

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play();
    else v.pause();
  }

  function handleScrub(e) {
    const v = videoRef.current;
    const value = Number(e.target.value);
    if (v) v.currentTime = value;
    setCurrentTime(value);
  }

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div>
      <div className="video-wrapper">
        <video
          ref={videoRef}
          className="video-player"
          src={videoUrl}
          playsInline
          key={videoUrl}
          onClick={togglePlay}
        >
          Je browser ondersteunt geen video-weergave.
        </video>
        <canvas ref={canvasRef} className="pose-overlay-canvas" />
        {isAnalyzing && (
          <div className="scan-overlay">
            <div className="scan-line" />
            <span className="scan-text">AI analyseert swing-plane</span>
          </div>
        )}
      </div>

      <div className="custom-controls">
        <button
          type="button"
          className="play-btn"
          onClick={togglePlay}
          aria-label={isPlaying ? "Pauzeer" : "Speel af"}
        >
          <Icon name={isPlaying ? "pause" : "play"} size={14} />
        </button>
        <span className="time-display">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
        <input
          type="range"
          className="scrub-bar"
          min={0}
          max={duration || 0}
          step={0.01}
          value={currentTime}
          onChange={handleScrub}
          style={{ "--progress": `${progress}%` }}
        />
      </div>

      <label className="overlay-toggle">
        <input
          type="checkbox"
          checked={overlayEnabled}
          onChange={(e) => setOverlayEnabled(e.target.checked)}
        />
        Lichaamshouding tonen
        {modelStatus === "loading" && " — model laden"}
        {modelStatus === "error" && " — analyse kon niet geladen worden"}
      </label>
    </div>
  );
}
