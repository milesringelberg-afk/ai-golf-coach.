// Gangbare clubs, gegroepeerd zoals ze in een tas zitten. De `id` wordt
// opgeslagen in de database; het label is puur voor weergave.
export const CLUB_GROUPS = [
  {
    group: "Hout",
    clubs: [
      { id: "driver", label: "Driver" },
      { id: "3w", label: "3 Hout" },
      { id: "5w", label: "5 Hout" },
    ],
  },
  {
    group: "Hybride",
    clubs: [
      { id: "h3", label: "Hybride 3" },
      { id: "h4", label: "Hybride 4" },
      { id: "h5", label: "Hybride 5" },
    ],
  },
  {
    group: "IJzers",
    clubs: [
      { id: "i4", label: "i4" },
      { id: "i5", label: "i5" },
      { id: "i6", label: "i6" },
      { id: "i7", label: "i7" },
      { id: "i8", label: "i8" },
      { id: "i9", label: "i9" },
    ],
  },
  {
    group: "Wedges",
    clubs: [
      { id: "pw", label: "PW" },
      { id: "gw", label: "GW" },
      { id: "sw", label: "SW" },
      { id: "lw", label: "LW" },
    ],
  },
  {
    group: "Overig",
    clubs: [{ id: "putter", label: "Putter" }],
  },
];

const LABEL_BY_ID = new Map(
  CLUB_GROUPS.flatMap((g) => g.clubs).map((c) => [c.id, c.label])
);

/** Toonbaar label voor een opgeslagen club-id. */
export function clubLabel(id) {
  if (!id) return null;
  return LABEL_BY_ID.get(id) ?? id;
}
