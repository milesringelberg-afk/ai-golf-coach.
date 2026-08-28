// De systeem-prompt in backend/routes/coach.js schrijft vier vaste kopjes voor.
// Hier splitsen we die tekst op in losse velden, zodat ze apart in de database
// kunnen. Wijkt het antwoord af van dat format, dan komt alles in rootCause
// terecht — liever alles bewaren op één plek dan stilletjes tekst kwijtraken.
const SECTION_MATCHERS = [
  { key: "rootCause", test: /oorzaak|root\s*cause/i },
  { key: "feel", test: /gevoel|feel\s*drill/i },
  { key: "prop", test: /hulpmiddel|prop\s*drill/i },
  { key: "mental", test: /mentaal|mentale|visualisatie|swing\s*thought/i },
];

function classify(heading) {
  for (const { key, test } of SECTION_MATCHERS) {
    if (test.test(heading)) return key;
  }
  return null;
}

export function parseCoachSections(raw) {
  const empty = { rootCause: null, feel: null, prop: null, mental: null };
  if (!raw || typeof raw !== "string" || !raw.trim()) return empty;

  const lines = raw.split(/\r?\n/);
  const result = { ...empty };

  let current = null;
  let buffer = [];
  let sawHeading = false;

  function flush() {
    if (!current) return;
    const text = buffer.join("\n").trim();
    if (text) {
      result[current] = result[current] ? `${result[current]}\n\n${text}` : text;
    }
    buffer = [];
  }

  for (const line of lines) {
    const headingMatch = /^\s*#{1,6}\s*(.+?)\s*$/.exec(line);
    if (headingMatch) {
      const key = classify(headingMatch[1]);
      if (key) {
        flush();
        current = key;
        sawHeading = true;
        continue;
      }
    }
    if (current) buffer.push(line);
  }
  flush();

  // Geen enkel herkenbaar kopje: bewaar de volledige tekst als oorzaak.
  if (!sawHeading) {
    return { ...empty, rootCause: raw.trim() };
  }

  return result;
}
