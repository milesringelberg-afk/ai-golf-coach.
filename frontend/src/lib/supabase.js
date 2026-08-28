import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// De app blijft volledig werken zonder Supabase — alleen inloggen en
// historie zijn dan uitgeschakeld in plaats van dat de boel crasht.
export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

// Supabase-foutmeldingen zijn Engels en soms cryptisch; dit maakt de
// meest voorkomende gevallen begrijpelijk voor de gebruiker.
export function friendlyError(error) {
  if (!error) return null;
  const msg = (error.message || "").toLowerCase();

  if (msg.includes("invalid login credentials")) {
    return "E-mailadres of wachtwoord klopt niet.";
  }
  if (msg.includes("email not confirmed")) {
    return "Bevestig eerst je e-mailadres via de link die je hebt gekregen.";
  }
  if (msg.includes("user already registered") || msg.includes("already been registered")) {
    return "Er bestaat al een account met dit e-mailadres. Log in plaats daarvan in.";
  }
  if (msg.includes("password should be at least")) {
    return "Kies een wachtwoord van minimaal 6 tekens.";
  }
  if (msg.includes("rate limit") || msg.includes("too many")) {
    return "Te veel pogingen. Wacht even en probeer het opnieuw.";
  }
  if (msg.includes("failed to fetch") || msg.includes("networkerror")) {
    return "Geen verbinding met de database. Controleer je internetverbinding.";
  }
  if (msg.includes("row-level security") || msg.includes("violates row-level")) {
    return "Geen toegang tot deze gegevens. Log opnieuw in en probeer het nog eens.";
  }
  if (msg.includes("jwt") || msg.includes("token is expired")) {
    return "Je sessie is verlopen. Log opnieuw in.";
  }
  if (msg.includes("payload too large") || msg.includes("exceeded the maximum")) {
    return "Deze video is te groot voor de opslag. Probeer een kortere opname.";
  }
  if (msg.includes("exceeded") && msg.includes("quota")) {
    return "De opslagruimte van je account zit vol. Verwijder een oudere swing.";
  }
  return error.message || "Er ging iets mis.";
}
