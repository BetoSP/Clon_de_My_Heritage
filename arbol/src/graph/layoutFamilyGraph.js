// Layout engine: assigns (x, y) positions to graph nodes for 2D rendering.
//
// Input:  graph = { nodes, edges }  (output of buildFamilyGraph)
// Output: { nodes: [...node, x, y], edges }
//
// Algoritmo: dos pasadas
//   Pasada 1 (bottom-up): calcula el ancho del subárbol de cada grupo
//   Pasada 2 (top-down):  asigna posiciones X reales
//
// ⚠️  Todas las constantes dimensionales viven en geometry.js.

import { PARENT_EDGE_TYPES, COUPLE_TYPES } from "./relationshipTypes.js";
import {
  PERSON_W,
  PERSON_H,
  UNION_R,
  H_SPACING,
  V_SPACING,
} from "./geometry.js";

export function layoutFamilyGraph(graph) {
  const { nodes, edges } = graph;

  if (nodes.length === 0) return { nodes: [], edges };

  // ── 1. Mapas de adyacencia ────────────────────────────────────────────────

  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const parentsOf = new Map(nodes.map((n) => [n.id, []]));
  const unionPersons = new Map();
  const personUnions = new Map();

  for (const edge of edges) {
    if (PARENT_EDGE_TYPES.has(edge.type)) {
      parentsOf.get(edge.target)?.push(edge.source);
    }
    if (COUPLE_TYPES.has(edge.type)) {
      if (!unionPersons.has(edge.target)) unionPersons.set(edge.target, []);
      unionPersons.get(edge.target).push(edge.source);
      if (!personUnions.has(edge.source)) personUnions.set(edge.source, []);
      personUnions.get(edge.source).push(edge.target);
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

  function getSpouseIds(personId) {
    const result = [];
    for (const unionId of personUnions.get(personId) ?? []) {
      for (const sid of unionPersons.get(unionId) ?? []) {
        if (sid !== personId) result.push(sid);
      }
    }
    return result;
  }

  function getUnionSinceYear(personId, spouseId) {
    for (const unionId of personUnions.get(personId) ?? []) {
      const members = unionPersons.get(unionId) ?? [];
      if (members.includes(spouseId)) {
        const edge = edges.find((e) => COUPLE_TYPES.has(e.type) && e.target === unionId);
        return edge?.since_year ?? null;
      }
    }
    return null;
  }

  function getChildren(personId) {
    const result = new Set();
    for (const e of edges) {
      if (e.type === "child_of") {
        const unionMembers = unionPersons.get(e.source) ?? [];
        if (unionMembers.includes(personId)) result.add(e.target);
      }
      if (PARENT_EDGE_TYPES.has(e.type) && e.source === personId) {
        result.add(e.target);
      }
    }
    return [...result];
  }

  // ── 2. Generaciones ───────────────────────────────────────────────────────

  const gen = new Map();
  let changed = true;
  while (changed) {
    changed = false;
    for (const node of nodes) {
      if (node.type !== "person" || gen.has(node.id)) continue;
      const ancestors = ancestorPersonIds(node.id);
      if (ancestors.length === 0) {
        gen.set(node.id, 0); changed = true;
      } else if (ancestors.every((id) => gen.has(id))) {
        gen.set(node.id, Math.max(...ancestors.map((id) => gen.get(id))) + 1);
        changed = true;
      }
    }
  }
  for (const node of nodes) {
    if (node.type === "person" && !gen.has(node.id)) gen.set(node.id, 0);
  }

  // Nivelar cónyuges
  let leveled = true;
  while (leveled) {
    leveled = false;
    for (const node of nodes) {
      if (node.type !== "union") continue;
      const spouseIds = unionPersons.get(node.id) ?? [];
      if (spouseIds.length < 2) continue;
      const maxGen = Math.max(...spouseIds.map((id) => gen.get(id) ?? 0));
      for (const id of spouseIds) {
        if ((gen.get(id) ?? 0) < maxGen) { gen.set(id, maxGen); leveled = true; }
      }
    }
  }
  for (const node of nodes) {
    if (node.type !== "union") continue;
    const spouseIds = unionPersons.get(node.id) ?? [];
    gen.set(node.id, spouseIds.length
      ? Math.max(...spouseIds.map((id) => gen.get(id) ?? 0))
      : 0);
  }

  const maxGenV = Math.max(...gen.values(), 0);

  // ── 3. Construir grupos ───────────────────────────────────────────────────

  const isSecondaryInGroup = new Set();

  for (const [unionId, spouseIds] of unionPersons) {
    if (spouseIds.length < 2) continue;
    const sorted = [...spouseIds].sort((a, b) => {
      const aHasAncestors = ancestorPersonIds(a).length > 0;
      const bHasAncestors = ancestorPersonIds(b).length > 0;
      if (aHasAncestors && !bHasAncestors) return -1;
      if (!aHasAncestors && bHasAncestors) return 1;
      return Number(a) - Number(b);
    });
    for (let i = 1; i < sorted.length; i++) {
      isSecondaryInGroup.add(sorted[i]);
    }
  }

  // ── 4. Calcular ancho de subárbol (bottom-up) ─────────────────────────────

  const subtreeWidth = new Map();

  function getGroupSpouses(personId) {
    return getSpouseIds(personId)
      .filter((sid) => isSecondaryInGroup.has(sid))
      .sort((a, b) => {
        const ya = getUnionSinceYear(personId, a) ?? null;
        const yb = getUnionSinceYear(personId, b) ?? null;
        if (ya !== null && yb !== null) return ya - yb;
        if (ya !== null) return -1;
        if (yb !== null) return 1;
        return Number(a) - Number(b);
      });
  }

  function getSortedChildren(personId) {
    const myGen = gen.get(personId) ?? 0;
    return getChildren(personId)
      .filter((cid) => !isSecondaryInGroup.has(cid) && (gen.get(cid) ?? 0) === myGen + 1)
      .sort((a, b) => {
        const ya = nodeById.get(a)?.data?.birth_year ?? null;
        const yb = nodeById.get(b)?.data?.birth_year ?? null;
        if (ya !== null && yb !== null) return ya - yb;
        if (ya !== null) return -1;
        if (yb !== null) return 1;
        return Number(a) - Number(b);
      });
  }

  function calcSubtreeWidth(personId) {
    if (subtreeWidth.has(personId)) return subtreeWidth.get(personId);
    if (isSecondaryInGroup.has(personId)) return 0;

    const groupSpouses = getGroupSpouses(personId);
    const groupW = (1 + groupSpouses.length) * H_SPACING;
    const children = getSortedChildren(personId);

    if (children.length === 0) {
      subtreeWidth.set(personId, groupW);
      return groupW;
    }

    let childrenTotalW = 0;
    for (const cid of children) {
      childrenTotalW += calcSubtreeWidth(cid);
    }

    const w = Math.max(groupW, childrenTotalW);
    subtreeWidth.set(personId, w);
    return w;
  }

  const roots = nodes.filter(
    (n) => n.type === "person" &&
      ancestorPersonIds(n.id).length === 0 &&
      !isSecondaryInGroup.has(n.id)
  ).sort((a, b) => {
    const ya = nodeById.get(a.id)?.data?.birth_year ?? null;
    const yb = nodeById.get(b.id)?.data?.birth_year ?? null;
    if (ya !== null && yb !== null) return ya - yb;
    if (ya !== null) return -1;
    if (yb !== null) return 1;
    return Number(a.id) - Number(b.id);
  });

  for (const root of roots) calcSubtreeWidth(root.id);

  // ── 5. Asignar posiciones X (top-down) ───────────────────────────────────

  const xPos = new Map();

  function placeSubtree(personId, startX) {
    if (isSecondaryInGroup.has(personId)) return startX;
    if (xPos.has(personId)) return startX;

    const groupSpouses = getGroupSpouses(personId);
    const children = getSortedChildren(personId);
    const groupW = (1 + groupSpouses.length) * H_SPACING;

    if (children.length === 0) {
      xPos.set(personId, startX);
      groupSpouses.forEach((sid, i) => xPos.set(sid, startX + (i + 1) * H_SPACING));
      return startX + groupW;
    }

    let childX = startX;
    for (const cid of children) {
      childX = placeSubtree(cid, childX);
    }

    const firstChild = children[0];
    const lastChild = children[children.length - 1];
    const firstChildCenter = (xPos.get(firstChild) ?? startX) + PERSON_W / 2;
    const lastChildSpouses = getGroupSpouses(lastChild);
    const lastChildRightmost = lastChildSpouses.length > 0
      ? (xPos.get(lastChildSpouses[lastChildSpouses.length - 1]) ?? 0) + PERSON_W / 2
      : (xPos.get(lastChild) ?? startX) + PERSON_W / 2;

    const childrenSpanCenter = (firstChildCenter + lastChildRightmost) / 2;
    const groupCenterOffset = (groupSpouses.length * H_SPACING) / 2;
    const personX = childrenSpanCenter - PERSON_W / 2 - groupCenterOffset;
    const safePersonX = Math.max(personX, startX);

    xPos.set(personId, safePersonX);
    groupSpouses.forEach((sid, i) => xPos.set(sid, safePersonX + (i + 1) * H_SPACING));

    return Math.max(childX, safePersonX + groupW);
  }

  let currentX = 0;
  for (const root of roots) {
    currentX = placeSubtree(root.id, currentX);
  }

  const minX = Math.min(...xPos.values(), 0);
  if (minX < 0) {
    for (const [id, x] of xPos) xPos.set(id, x - minX);
  }

  // ── 6. Union nodes centrados entre sus cónyuges ───────────────────────────

  for (const node of nodes) {
    if (node.type !== "union") continue;
    const spouseIds = unionPersons.get(node.id) ?? [];
    const spouseCenterXs = spouseIds.map((id) => (xPos.get(id) ?? 0) + PERSON_W / 2);
    const unionCenterX = spouseCenterXs.length
      ? spouseCenterXs.reduce((a, b) => a + b, 0) / spouseCenterXs.length
      : 0;
    xPos.set(node.id, unionCenterX - UNION_R);
  }

  // ── 7. Build final layout ─────────────────────────────────────────────────

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