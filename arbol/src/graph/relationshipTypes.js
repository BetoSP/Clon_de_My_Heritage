// Single source of truth for all relationship type definitions.
//
// To add a new relationship type:
//   1. Add it to PARENT_TYPES (if it is a parent-child type).
//   2. No other files need to change.

// ── Parent-child types ─────────────────────────────────────────────────────
// Semantic: person_a = the parent / role-holder
//           person_b = the child  / subject
export const PARENT_TYPES = new Set([
  "father",
  "mother",
]);

// Edge types that establish generational hierarchy for the layout engine.
// "child_of" is derived at runtime by buildFamilyGraph — never stored in DB.
export const PARENT_EDGE_TYPES = new Set([
  "child_of",
  ...PARENT_TYPES,
]);