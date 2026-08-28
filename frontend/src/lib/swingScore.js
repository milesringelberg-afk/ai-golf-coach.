import { POSTURE_RANGES } from "./postureHints.js";

// ============================================================
//  Houdingsscore — wat dit WEL en NIET is
// ============================================================
//  WEL: een herhaalbare maat voor hoe dicht je address-houding bij de
//  richtlijn-bandbreedtes uit postureHints.js ligt. Handig om je eigen
//  swings onderling te vergelijken.
//
//  NIET: een golftechnische beoordeling. De app ziet geen club, geen bal
//  en geen balvlucht, en de bandbreedtes zijn zelf ingeschatte vuistregels,
//  geen sportwetenschappelijke norm. Een 100 betekent dus "netjes binnen
//  onze eigen richtlijn", niet "perfecte swing".
//
//  Formule per meting:
//    - Binnen de band  -> 100 punten, minus een kleine aftrek naarmate je
//                         verder van het midden van de band zit (max -15).
//    - Buiten de band  -> lineair aflopend, 0 punten bij een volle
//                         bandbreedte eronder of erboven.
//  De eindscore is het gemiddelde van de beschikbare metingen.
// ============================================================

const OFF_CENTRE_PENALTY = 15;

export function scoreMetric(value, range) {
  if (value == null || !Number.isFinite(value)) return null;

  const { min, max } = range;
  const width = max - min;
  if (width <= 0) return null;

  if (value >= min && value <= max) {
    const centre = (min + max) / 2;
    // 0 in het midden, 1 aan de rand van de band.
    const offCentre = Math.abs(value - centre) / (width / 2);
    return Math.round(100 - offCentre * OFF_CENTRE_PENALTY);
  }

  const distance = value < min ? min - value : value - max;
  const fraction = Math.min(1, distance / width);
  return Math.round(85 * (1 - fraction));
}

/**
 * Berekent de houdingsscore uit de address-meting.
 * Geeft null terug als er niets te scoren valt.
 */
export function computeSwingScore(addressPosture) {
  if (!addressPosture) return null;

  const parts = [
    { key: "kneeFlex", label: "Kniebuiging", score: scoreMetric(addressPosture.kneeFlex, POSTURE_RANGES.kneeFlex) },
    { key: "spineAngle", label: "Rughoek", score: scoreMetric(addressPosture.spineAngle, POSTURE_RANGES.spineAngle) },
  ].filter((p) => p.score != null);

  if (parts.length === 0) return null;

  const total = Math.round(parts.reduce((sum, p) => sum + p.score, 0) / parts.length);
  return { total, parts };
}

/** Grove indeling voor de kleur/labeling in de UI. */
export function scoreBand(total) {
  if (total == null) return null;
  if (total >= 85) return "sterk";
  if (total >= 65) return "degelijk";
  return "aandacht";
}
