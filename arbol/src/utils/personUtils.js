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

// Computes the full surname string for DB storage.
// Includes "de [surname_married]" for women (see DECISIONS [021]).
export function computeFullSurnames(surname_1, surname_2, surname_married, gender) {
  const base = [surname_1, surname_2].filter(Boolean).join(" ");
  if (gender === "female" && surname_married) {
    return base ? `${base} de ${surname_married}` : `de ${surname_married}`;
  }
  return base || null;
}
