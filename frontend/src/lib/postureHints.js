// Grove richtlijn-bandbreedtes voor de address-houding. Zelf ingeschat, niet
// ontleend aan sportwetenschappelijk onderzoek — één bron van waarheid voor
// zowel de tekst-hints hieronder als de balkjes in de Stats-weergave.
export const POSTURE_RANGES = {
  kneeFlex: { min: 12, max: 38 },
  spineAngle: { min: 15, max: 48 },
};

// Simpele, regelgebaseerde vuistregels voor de address-houding — géén AI-
// beoordeling, alleen grove drempelwaarden op de berekende hoeken. Bedoeld
// als richting, niet als vervanging van een echte coach.
export function getPostureHints(posture) {
  if (!posture) return [];
  const hints = [];

  if (posture.kneeFlex < POSTURE_RANGES.kneeFlex.min) {
    hints.push({
      label: "Kniebuiging",
      text: "Je staat vrij gestrekt in je knieën. Buig iets meer door voor een stabielere, atletische basis.",
      drill:
        "Drill: zak 10x rustig door je knieën tot je lichte spanning voelt in je bovenbenen, en swing meteen vanuit die positie.",
    });
  } else if (posture.kneeFlex > POSTURE_RANGES.kneeFlex.max) {
    hints.push({
      label: "Kniebuiging",
      text: "Je knieën zijn behoorlijk gebogen — dit kan ten koste gaan van je balans en heupdraai.",
      drill:
        "Drill: ga voor een spiegel staan en zoek de houding waarbij je armen net comfortabel loshangen zonder verder te zakken.",
    });
  }

  if (posture.spineAngle < POSTURE_RANGES.spineAngle.min) {
    hints.push({
      label: "Rughoek",
      text: "Je staat vrij rechtop. Buig iets meer voorover vanuit de heupen (niet de rug) voor een betere swing-plane.",
      drill:
        "Drill: buig voorover tot je een club plat op de grond kan leggen tegen je romp, met een rechte rug.",
    });
  } else if (posture.spineAngle > POSTURE_RANGES.spineAngle.max) {
    hints.push({
      label: "Rughoek",
      text: "Je buigt behoorlijk ver voorover — check of dit comfortabel vol te houden is tijdens de hele swing.",
      drill: "Drill: oefen je address 5x voor een spiegel en let erop dat je rug recht blijft, niet bol.",
    });
  }

  return hints.slice(0, 2);
}
