import { supabase } from "./supabase.js";

const BUCKET = "swings";

// Signed URLs verlopen; 1 uur is ruim genoeg om een video te bekijken.
const SIGNED_URL_SECONDS = 3600;

function requireClient() {
  if (!supabase) throw new Error("Supabase is niet geconfigureerd.");
  return supabase;
}

function extensionFor(file) {
  const match = /\.([a-z0-9]+)$/i.exec(file.name || "");
  return match ? match[1].toLowerCase() : "mp4";
}

/**
 * Uploadt de video naar de private bucket. Het pad begint met de user-id,
 * want daar hangen de storage-beveiligingsregels op.
 */
async function uploadVideo(client, userId, file) {
  const path = `${userId}/${crypto.randomUUID()}.${extensionFor(file)}`;
  const { error } = await client.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || "video/mp4",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

/**
 * Slaat één swing op: eerst de video, dan de rij met metingen.
 * Mislukt de rij, dan ruimen we de zojuist geüploade video weer op —
 * anders blijft er een weesbestand achter dat wel ruimte kost.
 */
export async function saveAnalysis({
  file,
  addressPosture,
  liveMetrics,
  phases,
  coach,
  club,
  swingScore,
  cameraAngle,
}) {
  const client = requireClient();

  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error("Je bent niet ingelogd.");

  let videoPath = null;
  if (file) {
    videoPath = await uploadVideo(client, user.id, file);
  }

  const row = {
    user_id: user.id,
    video_path: videoPath,
    video_name: file?.name ?? null,
    video_size: file?.size ?? null,
    knee_flex: addressPosture?.kneeFlex ?? null,
    spine_angle: addressPosture?.spineAngle ?? null,
    shoulder_rotation: liveMetrics?.shoulderRotation ?? null,
    hip_rotation: liveMetrics?.hipRotation ?? null,
    x_factor: liveMetrics?.xFactor ?? null,
    phases: phases ?? null,
    club: club ?? null,
    camera_angle: cameraAngle ?? null,
    swing_score: swingScore ?? null,
    coach_root_cause: coach?.rootCause ?? null,
    coach_feel: coach?.feel ?? null,
    coach_prop: coach?.prop ?? null,
    coach_mental: coach?.mental ?? null,
  };

  const { data, error } = await client.from("swing_analyses").insert(row).select().single();

  if (error) {
    if (videoPath) {
      await client.storage
        .from(BUCKET)
        .remove([videoPath])
        .catch(() => {});
    }
    throw error;
  }

  return data;
}

export async function listAnalyses() {
  const client = requireClient();
  const { data, error } = await client
    .from("swing_analyses")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function deleteAnalysis(analysis) {
  const client = requireClient();

  const { error } = await client.from("swing_analyses").delete().eq("id", analysis.id);
  if (error) throw error;

  // Pas de video weghalen als de rij echt weg is.
  if (analysis.video_path) {
    await client.storage
      .from(BUCKET)
      .remove([analysis.video_path])
      .catch(() => {});
  }
}

/** Tijdelijke kijk-URL voor een privé opgeslagen video. */
export async function getVideoUrl(videoPath) {
  if (!videoPath) return null;
  const client = requireClient();
  const { data, error } = await client.storage
    .from(BUCKET)
    .createSignedUrl(videoPath, SIGNED_URL_SECONDS);
  if (error) throw error;
  return data?.signedUrl ?? null;
}
