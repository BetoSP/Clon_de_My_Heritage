// Graph engine: transforms raw Supabase data into a consistent graph structure.
//
// Input
//   people        — rows from the `people` table
//   relationships — rows from the `relationships` table
//
// Output
//   {
//     nodes: Array<PersonNode | UnionNode>
//     edges: Array<Edge>
//   }
//
// PersonNode : { id: string, type: "person", data: { name, surnames, birth_day, birth_month,
//               birth_year, gender, adopted } }
// UnionNode  : { id: string, type: "union",  data: { person_a_id: string, person_b_id: string } }
// Edge       : { id: string, type: string, source: string, target: string,
//               since_year: number|null, until_year: number|null }
//
// Union nodes are derived at runtime — they are never stored in the database.
// Each unique couple (spouse relationship) produces exactly one union node,
// identified by the deterministic key "min_id-max_id".
//
// Children whose BOTH parents belong to a recognized couple are connected to
// the union node (not directly to the individual parents). Children with only
// one recorded parent, or whose parents are not a registered couple, keep
// direct parent→child edges.

import { PARENT_TYPES } from "./relationshipTypes.js";

export function buildFamilyGraph(people, relationships) {
  // ── Step 1: Person nodes ─────────────────────────────────────────────────
  const personNodeMap = new Map();

  for (const person of people) {
    if (personNodeMap.has(person.id)) continue;
    personNodeMap.set(person.id, {
      id: String(person.id),
      type: "person",
      data: {
        name: person.name,
        surnames: person.surnames ?? null,
        birth_day: person.birth_day ?? null,
        birth_month: person.birth_month ?? null,
        birth_year: person.birth_year ?? null,
        gender: person.gender,
        adopted: person.adopted ?? false,
      },
    });
  }

  // ── Step 2: Union nodes ──────────────────────────────────────────────────
  const unionNodeMap = new Map();

  for (const rel of relationships) {
    if (rel.type !== "spouse") continue;
    const a = Math.min(rel.person_a_id, rel.person_b_id);
    const b = Math.max(rel.person_a_id, rel.person_b_id);
    const key = `${a}-${b}`;
    if (!unionNodeMap.has(key)) {
      unionNodeMap.set(key, {
        id: `union-${key}`,
        type: "union",
        data: { person_a_id: String(a), person_b_id: String(b) },
      });
    }
  }

  // ── Step 3: Spouse edges (person → union node) ───────────────────────────
  const edges = [];

  for (const rel of relationships) {
    if (rel.type !== "spouse") continue;
    const a = Math.min(rel.person_a_id, rel.person_b_id);
    const b = Math.max(rel.person_a_id, rel.person_b_id);
    const unionId = unionNodeMap.get(`${a}-${b}`).id;

    edges.push(
      {
        id: `edge-${rel.id}-a`,
        type: "spouse",
        source: String(a),
        target: unionId,
        since_year: rel.since_year ?? null,
        until_year: rel.until_year ?? null,
      },
      {
        id: `edge-${rel.id}-b`,
        type: "spouse",
        source: String(b),
        target: unionId,
        since_year: rel.since_year ?? null,
        until_year: rel.until_year ?? null,
      }
    );
  }

  // ── Step 4: Parent→child edges with union node rerouting ─────────────────
  const parentRels = relationships.filter((r) => PARENT_TYPES.has(r.type));

  const childParentIndex = new Map();
  for (const rel of parentRels) {
    const cid = String(rel.person_b_id);
    if (!childParentIndex.has(cid)) childParentIndex.set(cid, new Map());
    childParentIndex.get(cid).set(String(rel.person_a_id), rel);
  }

  const absorbedRelIds = new Set();

  for (const unionNode of unionNodeMap.values()) {
    const a = unionNode.data.person_a_id;
    const b = unionNode.data.person_b_id;

    for (const [childId, parentMap] of childParentIndex) {
      if (!parentMap.has(a) || !parentMap.has(b)) continue;

      const relA = parentMap.get(a);
      const relB = parentMap.get(b);
      absorbedRelIds.add(relA.id);
      absorbedRelIds.add(relB.id);

      const sinceYears = [relA.since_year, relB.since_year].filter((y) => y != null);

      edges.push({
        id: `edge-${unionNode.id}-child-${childId}`,
        type: "child_of",
        source: unionNode.id,
        target: String(childId),
        since_year: sinceYears.length ? Math.min(...sinceYears) : null,
        until_year: null,
      });
    }
  }

  for (const rel of parentRels) {
    if (absorbedRelIds.has(rel.id)) continue;
    edges.push({
      id: `edge-${rel.id}`,
      type: rel.type,
      source: String(rel.person_a_id),
      target: String(rel.person_b_id),
      since_year: rel.since_year ?? null,
      until_year: rel.until_year ?? null,
    });
  }

  // ── Step 5: Return final graph ───────────────────────────────────────────
  return {
    nodes: [...personNodeMap.values(), ...unionNodeMap.values()],
    edges,
  };
}