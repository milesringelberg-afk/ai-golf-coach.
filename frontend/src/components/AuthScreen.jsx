import { useState } from "react";
import Icon from "./Icon.jsx";
import { supabase, isSupabaseConfigured, friendlyError } from "../lib/supabase.js";

export default function AuthScreen() {
  const [mode, setMode] = useState("login"); // login | register
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle"); // idle | busy | check-email
  const [error, setError] = useState(null);

  if (!isSupabaseConfigured) {
    return (
      <div className="view-empty">
        <Icon name="plug" size={32} className="view-empty-icon" />
        <h2>Database nog niet gekoppeld</h2>
        <p>
          Er is nog geen Supabase-project ingesteld, dus inloggen en het bewaren van swings zijn
          uitgeschakeld. De rest van de app werkt gewoon.
        </p>
        <p className="auth-config-hint">
          Zet <code>VITE_SUPABASE_URL</code> en <code>VITE_SUPABASE_ANON_KEY</code> in{" "}
          <code>frontend/.env</code> om dit aan te zetten.
        </p>
      </div>
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setStatus("busy");

    try {
      if (mode === "register") {
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;

        // Staat e-mailbevestiging aan, dan is er nog geen sessie.
        if (!data.session) {
          setStatus("check-email");
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
      // Bij succes vangt de auth-listener in App.jsx de rest op.
      setStatus("idle");
    } catch (err) {
      setError(friendlyError(err));
      setStatus("idle");
    }
  }

  if (status === "check-email") {
    return (
      <div className="view-empty">
        <Icon name="mail" size={32} className="view-empty-icon" />
        <h2>Check je e-mail</h2>
        <p>
          We hebben een bevestigingslink gestuurd naar <strong>{email}</strong>. Klik die aan en kom
          daarna terug om in te loggen.
        </p>
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setStatus("idle");
            setMode("login");
          }}
        >
          Terug naar inloggen
        </button>
      </div>
    );
  }

  const busy = status === "busy";

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-head">
          <span className="auth-logo">
            <Icon name="swing" size={22} />
          </span>
          <h2 className="auth-title">Player Hub</h2>
          <p className="auth-mode">{mode === "login" ? "Inloggen" : "Account aanmaken"}</p>
          <p>
            {mode === "login"
              ? "Log in om je opgeslagen swings te bekijken."
              : "Maak een account om je swings te bewaren en te vergelijken."}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field-label">E-mailadres</span>
            <input
              type="email"
              className="field-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={busy}
              placeholder="jij@voorbeeld.nl"
            />
          </label>

          <label className="field">
            <span className="field-label">Wachtwoord</span>
            <input
              type="password"
              className="field-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={6}
              disabled={busy}
              placeholder={mode === "register" ? "Minimaal 6 tekens" : "••••••••"}
            />
          </label>

          {error && (
            <p className="alert-chip alert-chip-error">
              <Icon name="alert" size={15} />
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary auth-submit" disabled={busy}>
            {busy ? "Bezig" : mode === "login" ? "Inloggen" : "Account aanmaken"}
          </button>
        </form>

        <p className="auth-switch">
          {mode === "login" ? "Nog geen account?" : "Heb je al een account?"}{" "}
          <button
            type="button"
            className="link-button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError(null);
            }}
          >
            {mode === "login" ? "Registreren" : "Inloggen"}
          </button>
        </p>
      </div>
    </div>
  );
}
