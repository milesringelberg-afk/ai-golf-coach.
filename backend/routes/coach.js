import { Router } from "express";
import { getAnthropicClient } from "../lib/anthropicClient.js";

const router = Router();

const MODEL = "claude-opus-5";

const SYSTEM_PROMPT = `Je bent een Master PGA Professional golfcoach. Je krijgt geen video te zien —
alleen een paar geometrische cijfers (hoeken en timing), berekend uit lichaamshoudings-
herkenning op een swingvideo van een amateur golfer. Analyseer deze cijfers en geef feedback
in het Nederlands, EXACT in de volgende structuur, zonder overbodige inleiding of afsluiting:

## 1. De Dieperliggende Oorzaak (Root Cause)
Leg niet alleen uit WAT de cijfers laten zien, maar WAAROM dit waarschijnlijk gebeurt —
redeneer van de gemeten hoeken naar de onderliggende swingfout of -sterkte.

## 2. Optie A: De Gevoels-oefening (Feel Drill)
Een oefening gericht op het veranderen van het gevoel in de swing, met duidelijke stappen,
uitvoerbaar op de driving range.

## 3. Optie B: De Hulpmiddel-oefening (Prop Drill)
Een oefening met een alignment stick, handdoek, of golfbal-doosje voor fysieke feedback.

## 4. Optie C: De Mentale Visualisatie (Swing Thought)
Eén simpele gedachte of visualisatie voor tijdens de baan, als de swing onder druk staat.

Belangrijk: je hebt ALLEEN de meegegeven cijfers, geen camerabeeld, geen clubdata, geen
balvlucht. Baseer je conclusies uitsluitend op die cijfers en wees expliciet eerlijk als de
data te beperkt is om iets stelligs over te zeggen — verzin geen observaties (bv. over
clubface-hoek of balvlucht) die niet uit de gegeven getallen kunnen volgen. Wees direct,
concreet en actiegericht.`;

function buildUserPrompt({ addressPosture, rotation, phases }) {
  const lines = [
    "Analyseer de swing van een amateur golfer die zichzelf omschrijft als een " +
      "'power-swinger' met veel balsnelheid.",
  ];

  if (addressPosture) {
    lines.push(
      `Beginhouding (address): kniebuiging ${Math.round(addressPosture.kneeFlex)} graden, ` +
        `rughoek t.o.v. verticaal ${Math.round(addressPosture.spineAngle)} graden.`
    );
  }

  if (rotation) {
    lines.push(
      `Rotatie tijdens de swing (t.o.v. address): schouderdraaiing ` +
        `${Math.round(rotation.shoulderRotation)} graden, heupdraaiing ` +
        `${Math.round(rotation.hipRotation)} graden, X-factor (verschil schouder/heup) ` +
        `${Math.round(rotation.xFactor)} graden.`
    );
  }

  if (phases) {
    const timings = Object.entries(phases)
      .map(([key, frame]) => `${key}=${frame.t.toFixed(2)}s`)
      .join(", ");
    lines.push(`Herkende fasetijden (seconden vanaf start video): ${timings}.`);
  }

  return lines.join("\n");
}

router.post("/", async (req, res) => {
  const client = getAnthropicClient();
  if (!client) {
    return res.status(503).json({
      error:
        "Geen ANTHROPIC_API_KEY geconfigureerd op de server. Zie backend/.env.example.",
    });
  }

  const { addressPosture, rotation, phases } = req.body ?? {};
  if (!addressPosture && !rotation) {
    return res.status(400).json({ error: "Geen swingdata meegegeven." });
  }

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      thinking: { type: "adaptive" },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt({ addressPosture, rotation, phases }) }],
    });

    const text = message.content.find((block) => block.type === "text")?.text ?? "";
    res.json({ analysis: text });
  } catch (err) {
    console.error("Claude API-fout bij swing-analyse:", err);
    res.status(502).json({ error: "AI-analyse is mislukt. Probeer het later opnieuw." });
  }
});

export default router;
