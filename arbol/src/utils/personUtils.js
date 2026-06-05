// Computes the display surname string for a person object.
// Used in graph nodes and context bar — does NOT include surname_married
// when surname_1 is present (see DECISIONS [031]).
export function computeDisplaySurnames(person) {
  const s1 = person.surname_1 ?? null;
  const s2 = person.surname_2 ?? null;
  const sm = person.surname_married ?? null;
  if (s1) return [s1, s2].filter(Boolean).join(" ");
  if (sm) return `de ${sm}`;
  return null;
}
