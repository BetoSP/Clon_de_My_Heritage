// Single source of truth for all relationship type definitions.
//
// To add a new relationship type:
//   1. Add it to PARENT_TYPES if es parent-child (establece jerarquía generacional).
//   2. Add it to COUPLE_TYPES si es vínculo entre adultos al mismo nivel que spouse.
//   3. No other files need to change.

// ── Parent-child types ─────────────────────────────────────────────────────
// Semantic: person_a = the parent / role-holder
//           person_b = the child  / subject
export const PARENT_TYPES = new Set([
  "father",
  "mother",
]);

// ── Couple types ───────────────────────────────────────────────────────────
// Vínculos entre adultos al mismo nivel generacional.
// El layout los trata igual que spouse para posicionamiento.
export const COUPLE_TYPES = new Set([
  "spouse",
  "co_parent",
]);

// Edge types that establish generational hierarchy for the layout engine.
// "child_of" is derived at runtime by buildFamilyGraph — never stored in DB.
export const PARENT_EDGE_TYPES = new Set([
  "child_of",
  ...PARENT_TYPES,
]);