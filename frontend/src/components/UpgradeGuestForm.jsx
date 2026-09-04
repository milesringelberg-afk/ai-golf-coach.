import { useState } from "react";
import Icon from "./Icon.jsx";
import { supabase, friendlyError } from "../lib/supabase.js";

/**
 * Zet een gastsessie om in een echt account. Supabase houdt hierbij
 * dezelfde gebruiker aan, dus alle eerder bewaarde swings blijven staan —
 * dat is precies het verschil met "uitloggen en opnieuw registreren".
 */
export default function UpgradeGuestForm() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle"); // idle | busy | done
  const [error, setError] = useState(null);

  async function handleUpgrade(event) {
    event.preventDefault();
    setError(null);
    setStatus("busy");
    try {
      const { error: updateError } = await supabase.auth.updateUser({ email, password });
      if (updateError) throw updateError;
      setStatus("done");
    } catch (err) {
      setError(friendlyError(err));
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <p className="alert-chip alert-chip-success upgrade-result">
        <Icon name="check" size={15} />
        Bijna klaar — bevestig je e-mailadres via de link die we net hebben gestuurd. Je bewaarde
        swings blijven gewoon staan.
      </p>
    );
  }

  if (!open) {
    return (
      <button type="button" className="phase-button" onClick={() => setOpen(true)}>
        Account aanmaken en swings behouden
      </button>
    );
  }

  return (
    <form className="auth-form upgrade-form" onSubmit={handleUpgrade}>
      <p className="tab-hint">
        Kies een e-mailadres en wachtwoord. Je blijft dezelfde gebruiker, dus je bewaarde swings
        gaan mee.
      </p>

      <label className="field">
        <span className="field-label">E-mailadres</span>
        <input
          type="email"
          className="field-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          disabled={status === "busy"}
        />
      </label>

      <label className="field">
        <span className="field-label">Wachtwoord</span>
        <input
          type="password"
          className="field-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
          minLength={6}
          disabled={status === "busy"}
        />
      </label>

      {error && (
        <p className="alert-chip alert-chip-error">
          <Icon name="alert" size={15} />
          {error}
        </p>
      )}

      <button type="submit" className="btn-primary" disabled={status === "busy"}>
        {status === "busy" ? "Bezig" : "Account aanmaken"}
      </button>
    </form>
  );
}
