import { useRef, useState } from "react";

export default function VideoUploader({ onUploaded }) {
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
      onUploaded({ url: data.file.url, tips: data.coachingTips });
    } catch (err) {
      setError(err.message || "Er ging iets mis bij het uploaden.");
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
        <div className="dropzone-icon">🎥</div>
        {isUploading ? (
          <p>Bezig met uploaden van "{fileName}"…</p>
        ) : (
          <>
            <p className="dropzone-title">Sleep je video hierheen of klik om te selecteren</p>
            <p className="dropzone-subtitle">MP4, MOV, WEBM of AVI — max 200MB</p>
          </>
        )}
      </div>
      {error && <p className="error-message">{error}</p>}
      {fileName && !isUploading && !error && (
        <p className="upload-success">✅ "{fileName}" geüpload</p>
      )}
    </div>
  );
}
