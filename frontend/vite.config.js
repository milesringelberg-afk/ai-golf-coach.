import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Vite geeft normaal alléén variabelen door die met VITE_ beginnen.
// Op hostingplatforms is het een klassieke valkuil om ze zonder dat
// voorvoegsel in te stellen: de build slaagt dan gewoon, maar de site
// draait zonder database en zegt "nog niet gekoppeld". Daarom accepteren
// we hier beide schrijfwijzen en waarschuwen we bij een lege waarde.
function resolveSupabaseEnv(mode) {
  const fileEnv = loadEnv(mode, process.cwd(), "");
  const pick = (...names) => {
    for (const name of names) {
      const value = process.env[name] ?? fileEnv[name];
      if (value) return { value, name };
    }
    return { value: "", name: null };
  };

  const url = pick("VITE_SUPABASE_URL", "SUPABASE_URL");
  const key = pick("VITE_SUPABASE_ANON_KEY", "SUPABASE_ANON_KEY");

  for (const [label, found] of [["URL", url], ["ANON KEY", key]]) {
    if (found.name && !found.name.startsWith("VITE_")) {
      console.warn(
        `[supabase] ${label} gevonden als "${found.name}". Vite geeft alleen ` +
          `VITE_-variabelen door aan de browser, dus deze is automatisch ` +
          `omgezet. Hernoem hem liever naar "VITE_${found.name}".`
      );
    }
  }

  if (!url.value || !key.value) {
    console.warn(
      "[supabase] Geen volledige configuratie gevonden. De app wordt gebouwd " +
        "zonder inloggen en zonder historie (de rest blijft gewoon werken). " +
        "Stel VITE_SUPABASE_URL en VITE_SUPABASE_ANON_KEY in om dit aan te zetten."
    );
  }

  return { url: url.value, key: key.value };
}

export default defineConfig(({ mode }) => {
  const supabase = resolveSupabaseEnv(mode);

  return {
    plugins: [react()],
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(supabase.url),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(supabase.key),
    },
    server: {
      port: 5173,
      proxy: {
        "/api": "http://localhost:3001",
        "/uploads": "http://localhost:3001",
      },
    },
  };
});
