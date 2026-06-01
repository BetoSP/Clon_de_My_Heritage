// Layout engine: assigns (x, y) positions to graph nodes for 2D rendering.
//
// Input:  graph = { nodes, edges }  (output of buildFamilyGraph)
// Output: { nodes: [...node, x, y], edges }
//
// Coordinate system:
//   x, y = top-left corner of the node bounding box
//   Person node bounding box: PERSON_W × PERSON_H
//   Union node bounding box:  (2*UNION_R) × (2*UNION_R)
//
// Layout rules:
//   - Generation 0 = roots (persons with no recorded parents)
//   - Each generation sits on y = gen * V_SPACING
//   - Union nodes are vertically centered with person nodes at the same generation
//   - Union nodes are centered horizontally between their two spouses
//   - Children are centered under their parents (union node or single parent)
//   - Minimum H_SPACING is enforced between siblings to prevent overlap
//   - Spouses are always placed at the same generation (leveled to the higher one)
//   - Spouses without ancestors are placed beside their partner, respecting occupied space
//   - Output is 100% deterministic: same input → same output
//
// ⚠️  Todas las constantes dimensionales viven en geometry.js.
//     No definir valores visuales en este archivo.

import { PARENT_EDGE_TYPES } from "./relationshipTypes.js";
import {
  PERSON_W,
  PERSON_H,
  UNION_R,
  H_SPACING,
  V_SPACING,
} from "./geometry.js";

export function layoutFamilyGraph(graph) {
  const { nodes, edges } = graph;

  if (nodes.length === 0) {
    return { nodes: [], edges };
  }

  // ── 1. Build adjacency maps ───────────────────────────────────────────────

  const parentsOf = new Map(nodes.map((n) => [n.id, []]));
  const unionPersons = new Map(); // unionId → [personId, ...]
  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  for (const edge of edges) {
    if (PARENT_EDGE_TYPES.has(edge.type)) {
      parentsOf.get(edge.target)?.push(edge.source);
    }
    if (edge.type === "spouse") {
      if (!unionPersons.has(edge.target)) unionPersons.set(edge.target, []);
      unionPersons.get(edge.target).push(edge.source);
    }
  }

  function ancestorPersonIds(personId) {
    const result = [];
    for (const pid of parentsOf.get(personId) ?? []) {
      const pn = nodeById.get(pid);
      if (pn?.type === "person") result.push(pid);
      else if (pn?.type === "union") result.push(...(unionPersons.get(pid) ?? []));
    }
    return result;
  }

  // ── 2. Compute person generations ────────────────────────────────────────

  const gen = new Map();

  let changed = true;
  while (changed) {
    changed = false;
    for (const node of nodes) {
      if (node.type !== "person" || gen.has(node.id)) continue;
      const ancestors = ancestorPersonIds(node.id);
      if (ancestors.length === 0) {
        gen.set(node.id, 0);
        changed = true;
      } else if (ancestors.every((id) => gen.has(id))) {
        gen.set(node.id, Math.max(...ancestors.map((id) => gen.get(id))) + 1);
        changed = true;
      }
    }
  }
  for (const node of nodes) {
    if (node.type === "person" && !gen.has(node.id)) gen.set(node.id, 0);
  }
  for (const node of nodes) {
    if (node.type !== "union") continue;
    const spouseIds = unionPersons.get(node.id) ?? [];
    gen.set(
      node.id,
      spouseIds.length ? Math.max(...spouseIds.map((id) => gen.get(id) ?? 0)) : 0
    );
  }

  // ── 2b. Nivelar generaciones de cónyuges ─────────────────────────────────
  // Si dos cónyuges están en generaciones distintas, se igualan a la mayor.
  // Se repite hasta convergencia por si hay cadenas de cónyuges.

  let leveled = true;
  while (leveled) {
    leveled = false;
    for (const node of nodes) {
      if (node.type !== "union") continue;
      const spouseIds = unionPersons.get(node.id) ?? [];
      if (spouseIds.length < 2) continue;
      const gens = spouseIds.map((id) => gen.get(id) ?? 0);
      const maxGen = Math.max(...gens);
      for (const id of spouseIds) {
        if ((gen.get(id) ?? 0) < maxGen) {
          gen.set(id, maxGen);
          leveled = true;
        }
      }
    }
    // Recalcular union nodes tras cada pasada
    for (const node of nodes) {
      if (node.type !== "union") continue;
      const spouseIds = unionPersons.get(node.id) ?? [];
      gen.set(
        node.id,
        spouseIds.length ? Math.max(...spouseIds.map((id) => gen.get(id) ?? 0)) : 0
      );
    }
  }

  // ── 3. Assign x positions to person nodes, generation by generation ───────

  const xPos = new Map();
  const maxGenV = Math.max(...gen.values(), 0);

  // Mapeo: personId → [unionId, ...] para encontrar cónyuges
  const personUnions = new Map();
  for (const [unionId, spouseIds] of unionPersons) {
    for (const sid of spouseIds) {
      if (!personUnions.has(sid)) personUnions.set(sid, []);
      personUnions.get(sid).push(unionId);
    }
  }

  function getSpouseIds(personId) {
    const result = [];
    for (const unionId of personUnions.get(personId) ?? []) {
      for (const sid of unionPersons.get(unionId) ?? []) {
        if (sid !== personId) result.push(sid);
      }
    }
    return result;
  }

  for (let g = 0; g <= maxGenV; g++) {
    const persons = nodes
      .filter((n) => n.type === "person" && gen.get(n.id) === g);

    if (persons.length === 0) continue;

    // Separar en: tienen ancestros vs sin ancestros
    const withAncestors = persons.filter((p) => ancestorPersonIds(p.id).length > 0);
    const withoutAncestors = persons.filter((p) => ancestorPersonIds(p.id).length === 0);

    // Ordenar con-ancestros por posición de sus ancestros
    withAncestors.sort((a, b) => {
      const avgAncestorX = (p) => {
        const xs = ancestorPersonIds(p.id).map(
          (id) => (xPos.get(id) ?? 0) + PERSON_W / 2
        );
        return xs.length ? xs.reduce((s, v) => s + v, 0) / xs.length : 0;
      };
      const diff = avgAncestorX(a) - avgAncestorX(b);
      return diff !== 0 ? diff : Number(a.id) - Number(b.id);
    });

    // Asignar X a los que tienen ancestros
    const idealXs = withAncestors.map((p) => {
      const xs = ancestorPersonIds(p.id).map(
        (id) => (xPos.get(id) ?? 0) + PERSON_W / 2
      );
      return xs.reduce((s, v) => s + v, 0) / xs.length - PERSON_W / 2;
    });

    const finalXs = [...idealXs];
    for (let i = 1; i < finalXs.length; i++) {
      finalXs[i] = Math.max(finalXs[i], finalXs[i - 1] + H_SPACING);
    }
    withAncestors.forEach((node, i) => xPos.set(node.id, finalXs[i]));

    // Colocar los sin ancestros respetando el espacio ocupado en la generación
    for (const node of withoutAncestors) {
      const occupiedXs = persons
        .filter((n) => n.id !== node.id && xPos.has(n.id))
        .map((n) => xPos.get(n.id));
      const minSafeX = occupiedXs.length > 0 ? Math.max(...occupiedXs) + H_SPACING : 0;

      const spouseIds = getSpouseIds(node.id);
      const positionedSpouse = spouseIds.find((id) => xPos.has(id));
      const desiredX = positionedSpouse !== undefined
        ? xPos.get(positionedSpouse) + H_SPACING
        : minSafeX;

      xPos.set(node.id, Math.max(desiredX, minSafeX));
    }
  }

  const minX = Math.min(...xPos.values(), 0);
  if (minX < 0) {
    for (const [id, x] of xPos) xPos.set(id, x - minX);
  }

  // ── 4. Place union nodes centered between their spouses ──────────────────

  for (const node of nodes) {
    if (node.type !== "union") continue;
    const spouseIds = unionPersons.get(node.id) ?? [];
    const spouseCenterXs = spouseIds.map((id) => (xPos.get(id) ?? 0) + PERSON_W / 2);
    const unionCenterX = spouseCenterXs.length
      ? spouseCenterXs.reduce((a, b) => a + b, 0) / spouseCenterXs.length
      : 0;
    xPos.set(node.id, unionCenterX - UNION_R);
  }

  // ── 5. Build final layout ─────────────────────────────────────────────────

  const layoutNodes = nodes.map((node) => {
    const g = gen.get(node.id) ?? 0;
    const x = xPos.get(node.id) ?? 0;
    const y = node.type === "union"
      ? g * V_SPACING + PERSON_H / 2 - UNION_R
      : g * V_SPACING;
    return { ...node, x, y };
  });

  return { nodes: layoutNodes, edges };
}