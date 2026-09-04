// De camerastand bepaalt welke metingen zinvol zijn. Van voren zie je
// zijwaartse beweging goed; van achteren zie je juist of iemand zijn
// rughoek vasthoudt. Dezelfde getallen betekenen per hoek iets anders.
export const CAMERA_ANGLES = [
  {
    id: "face-on",
    label: "Van voren",
    short: "Face-On",
    hint: "Camera recht voor je, je borst naar de lens",
  },
  {
    id: "dtl",
    label: "Van achteren",
    short: "Down-the-Line",
    hint: "Camera achter je, langs de doellijn",
  },
];

const LABEL_BY_ID = new Map(CAMERA_ANGLES.map((a) => [a.id, a]));

export function angleLabel(id) {
  return LABEL_BY_ID.get(id)?.short ?? null;
}

// Grove richtlijnen. Zelf ingeschat, net als de andere drempels in deze app.
export const SWAY_LIMIT = 0.25; // in schouderbreedtes
export const SPINE_CHANGE_LIMIT = 10; // in graden

/**
 * Tips die passen bij de gekozen camerastand. Geeft een lege lijst terug
 * zolang er geen hoek is gekozen — we raden liever niks dan het verkeerde.
 */
export function getAngleHints({ cameraAngle, maxSway, maxSpineChange }) {
  const hints = [];

  if (cameraAngle === "face-on" && maxSway != null) {
    if (Math.abs(maxSway) > SWAY_LIMIT) {
      hints.push({
        label: "Sway",
        text:
          `Je heupen schuiven ongeveer ${Math.abs(maxSway).toFixed(2)} schouderbreedte ` +
          "zijwaarts weg van je startpositie. Veel zijwaartse beweging maakt het lastiger " +
          "om steeds hetzelfde raakpunt te vinden.",
        drill:
          "Drill: leg een alignment stick of clubschacht tegen de buitenkant van je achterste heup " +
          "en swing zonder die aan te raken.",
      });
    } else {
      hints.push({
        label: "Sway",
        text: "Je heupen blijven mooi boven je voeten — weinig zijwaartse verschuiving.",
        drill: null,
      });
    }
  }

  if (cameraAngle === "dtl" && maxSpineChange != null) {
    if (Math.abs(maxSpineChange) > SPINE_CHANGE_LIMIT) {
      const richting = maxSpineChange > 0 ? "buig je verder voorover" : "kom je omhoog";
      hints.push({
        label: "Rughoek",
        text:
          `Je rughoek verandert tot ${Math.abs(Math.round(maxSpineChange))} graden tijdens de ` +
          `swing — halverwege ${richting} ten opzichte van je beginhouding. Dat verandert je ` +
          "afstand tot de bal.",
        drill:
          "Drill: swing op halve snelheid en houd het gevoel vast dat je borst even ver van de " +
          "bal blijft van begin tot eind.",
      });
    } else {
      hints.push({
        label: "Rughoek",
        text: "Je houdt je rughoek goed vast tijdens de swing.",
        drill: null,
      });
    }
  }

  return hints;
}
