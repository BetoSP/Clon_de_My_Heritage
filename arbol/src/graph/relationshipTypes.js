// Single source of truth for all relationship type definitions.
//
// To add a new relationship type:
//   1. Add it to COUPLE_TYPES if es vínculo entre adultos al mismo nivel generacional.
//   2. Add it to PARENT_TYPES if establece jerarquía generacional.
//   3. No other files need to change.

// ── Couple types ───────────────────────────────────────────────────────────
// Vínculos entre adultos al mismo nivel generacional.
// El layout los trata igual para posicionamiento — generan union nodes.
// Valores válidos en DB: married, partner, co_parent, separated, divorced, widowed, unknown
export const COUPLE_TYPES = new Set([
  "married",
  "partner",
  "co_parent",
  "separated",
  "divorced",
  "widowed",
  "unknown",
]);

// ── Parent-child types ─────────────────────────────────────────────────────
// Semantic: person_a = the parent / role-holder
//           person_b = the child  / subject
export const PARENT_TYPES = new Set([
  "father",
  "mother",
  "adoptive_father",
  "adoptive_mother",
  "stepfather",
  "stepmother",
  "foster_father",
  "foster_mother",
]);

// Edge types that establish generational hierarchy for the layout engine.
// "child_of" is derived at runtime by buildFamilyGraph — never stored in DB.
export const PARENT_EDGE_TYPES = new Set([
  "child_of",
  ...PARENT_TYPES,
]);