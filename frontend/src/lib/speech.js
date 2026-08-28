// Lichte wrapper rond de browser-eigen Web Speech API (SpeechSynthesis).
// Geen library nodig — werkt alleen in browsers die dit ondersteunen
// (alle moderne desktop/mobiele browsers, behalve sommige oudere/embedded webviews).

let cachedVoice = null;

export function isSpeechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function pickDutchVoice() {
  if (cachedVoice) return cachedVoice;
  const voices = window.speechSynthesis.getVoices();
  cachedVoice = voices.find((v) => v.lang?.toLowerCase().startsWith("nl")) ?? voices[0] ?? null;
  return cachedVoice;
}

if (isSpeechSupported()) {
  // Voices laden soms async in — zodra ze binnen zijn, opnieuw kiezen.
  window.speechSynthesis.addEventListener("voiceschanged", () => {
    cachedVoice = null;
  });
}

export function speak(text) {
  if (!isSpeechSupported() || !text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "nl-NL";
  const voice = pickDutchVoice();
  if (voice) utterance.voice = voice;
  utterance.rate = 1;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (isSpeechSupported()) window.speechSynthesis.cancel();
}
