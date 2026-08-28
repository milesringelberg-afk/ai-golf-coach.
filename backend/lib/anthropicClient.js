import Anthropic from "@anthropic-ai/sdk";

let client = null;

// Geeft null terug als er geen API-key is geconfigureerd, zodat routes
// netjes kunnen degraderen i.p.v. te crashen.
export function getAnthropicClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) {
    client = new Anthropic(); // leest ANTHROPIC_API_KEY uit de omgeving
  }
  return client;
}
