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

// Computes an abbreviated display name (name + name_2) to fit within maxChars.
// Progressive levels: abbreviate name_2 → abbreviate name → truncate.
export function computeAbbreviatedName(name, name2, maxChars = 19) {
  const full = [name, name2].filter(Boolean).join(" ");
  if (full.length <= maxChars) return full;
  if (name2) {
    const level1 = `${name} ${name2[0]}.`;
    if (level1.length <= maxChars) return level1;
  }
  const level2 = name2 ? `${name[0]}. ${name2[0]}.` : `${name[0]}.`;
  if (level2.length <= maxChars) return level2;
  return full.slice(0, maxChars - 1) + "…";
}

// Computes abbreviated surnames to fit within maxChars.
// Progressive levels: abbreviate surname_2 → abbreviate surname_1 → truncate.
export function computeAbbreviatedSurnames(person, maxChars = 19) {
  const s1 = person.surname_1 ?? null;
  const s2 = person.surname_2 ?? null;
  const sm = person.surname_married ?? null;

  if (!s1 && !sm) return null;
  if (!s1) return `de ${sm}`.slice(0, maxChars);

  const full = s2 ? `${s1} ${s2}` : s1;
  if (full.length <= maxChars) return full;

  if (s2) {
    const level1 = `${s1} ${s2[0]}.`;
    if (level1.length <= maxChars) return level1;
    const level2 = `${s1[0]}. ${s2[0]}.`;
    if (level2.length <= maxChars) return level2;
  }
  return full.slice(0, maxChars - 1) + "…";
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
