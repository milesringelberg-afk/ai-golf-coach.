import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safeExt = path.extname(file.originalname).toLowerCase();
    cb(null, `swing-${timestamp}${safeExt}`);
  },
});

const allowedMimeTypes = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-msvideo",
]);

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Alleen video-bestanden (mp4, mov, webm, avi) zijn toegestaan."));
    }
  },
});

const router = Router();

// Placeholder-tips totdat de echte AI-swing-analyse is aangesloten.
function generateMockCoachingTips(filename) {
  return [
    {
      category: "Backswing",
      tip: "Je backswing lijkt iets te snel. Probeer een rustigere, gecontroleerde opbouw voor meer consistentie.",
    },
    {
      category: "Balans",
      tip: "Let op je gewichtsverdeling bij de top van de swing — blijf gecentreerd boven je voeten.",
    },
    {
      category: "Follow-through",
      tip: "Maak je follow-through iets langer door je heupen volledig te laten doordraaien richting het doel.",
    },
  ];
}

router.post("/", upload.single("video"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Geen video ontvangen." });
  }

  res.status(201).json({
    message: "Video succesvol geüpload.",
    file: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      url: `/uploads/${req.file.filename}`,
    },
    coachingTips: generateMockCoachingTips(req.file.filename),
  });
});

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

export default router;
