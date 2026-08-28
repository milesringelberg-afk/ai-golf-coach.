import { useRef, useState } from "react";

// Houdt het scan-effect minimaal zo lang zichtbaar, ook al is de (mock)
// analyse vrijwel instant. Zodra hier echte, langduriger AI-verwerking
// voor in de plaats komt, mag dit minimum eruit.
const MIN_ANALYZING_MS = 1800;

export default function VideoUploader({ onVideoSelected, onUploaded, onUploadFailed }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [error, setError] = useState(null);

  async function uploadFile(file) {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      setError("Selecteer een video-bestand (mp4, mov, webm, avi).");
      return;
    }

    setError(null);
    setIsUploading(true);
    setFileName(file.name);
    // Het File-object gaat mee omhoog zodat het later naar de database
    // geüpload kan worden zonder de video opnieuw op te halen.
    onVideoSelected(URL.createObjectURL(file), file);

    const startedAt = performance.now();
    const formData = new FormData();
    formData.append("video", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Upload mislukt.");
      }

      const data = await response.json();

      const elapsed = performance.now() - startedAt;
      if (elapsed < MIN_ANALYZING_MS) {
        await new Promise((resolve) => setTimeout(resolve, MIN_ANALYZING_MS - elapsed));
      }

      onUploaded({ url: data.file.url, tips: data.coachingTips });
    } catch (err) {
      setError(err.message || "Er ging iets mis bij het uploaden.");
      onUploadFailed();
    } finally {
      setIsUploading(false);
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    uploadFile(file);
  }

  return (
    <div>
      <div
        className={`dropzone ${isDragging ? "dropzone-active" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          hidden
          onChange={(e) => uploadFile(e.target.files?.[0])}
        />
        <div className="dropzone-icon-ring">
          <span className="dropzone-icon">{isUploading ? "⏳" : "🎥"}</span>
        </div>
        {isUploading ? (
          <p className="dropzone-title">Bezig met uploaden van "{fileName}"…</p>
        ) : (
          <>
            <p className="dropzone-title">Sleep je video hierheen of klik om te selecteren</p>
            <p className="dropzone-subtitle">MP4, MOV, WEBM of AVI — max 200MB</p>
          </>
        )}
      </div>
      {error && (
        <p className="alert-chip alert-chip-error">
          <span>⚠️</span> {error}
        </p>
      )}
      {fileName && !isUploading && !error && (
        <p className="alert-chip alert-chip-success">
          <span>✅</span> "{fileName}" geüpload
        </p>
      )}
    </div>
  );
}
