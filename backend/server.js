import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import uploadRouter from "./routes/upload.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/upload", uploadRouter);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// In productie serveert deze server ook de gebouwde React-app (frontend/dist),
// zodat frontend en backend samen als één Render-service draaien.
const frontendDist = path.join(__dirname, "..", "frontend", "dist");
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get(/^(?!\/api|\/uploads).*/, (req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`AI Golf Coach backend draait op http://localhost:${PORT}`);
});
