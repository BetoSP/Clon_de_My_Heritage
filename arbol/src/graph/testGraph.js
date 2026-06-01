// Temporary validation file for buildFamilyGraph.
// Run from arbol/ directory: node src/graph/testGraph.js
// DO NOT import into the app. DO NOT modify the graph engine.

import { buildFamilyGraph } from "./buildFamilyGraph.js";

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, label) {
  if (condition) {
    console.log(`    ✔  ${label}`);
    passed++;
  } else {
    console.error(`    ✘  FAIL: ${label}`);
    failed++;
    failures.push(label);
  }
}

function section(title) {
  console.log(`\n${"─".repeat(64)}`);
  console.log(`  ${title}`);
  console.log("─".repeat(64));
}

function printGraph(graph) {
  console.log("\n  nodes:");
  graph.nodes.forEach((n) => console.log("    " + JSON.stringify(n)));
  console.log("\n  edges:");
  graph.edges.forEach((e) => console.log("    " + JSON.stringify(e)));
  console.log();
}

// ─────────────────────────────────────────────────────────────────────────────
// CASE A — Familia nuclear estándar
// Carlos (1) + Ana (2) son cónyuges activos.
// Lucas (3) es hijo biológico de ambos.
// Esperado: union-1-2 existe, Lucas conectado a él, sin edges directos padre→hijo.
// ─────────────────────────────────────────────────────────────────────────────
section("CASE A — Familia nuclear (spouse activo + hijo biológico)");

const peopleA = [
  { id: 1, name: "Carlos", gender: "male",   birth_year: 1965, role: "padre" },
  { id: 2, name: "Ana",    gender: "female", birth_year: 1968, role: "madre" },
  { id: 3, name: "Lucas",  gender: "male",   birth_year: 1995, role: "hijo"  },
];

const relsA = [
  { id: 10, type: "spouse",            person_a_id: 1, person_b_id: 2, since_year: 1990, until_year: null },
  { id: 11, type: "biological_father", person_a_id: 1, person_b_id: 3, since_year: null, until_year: null },
  { id: 12, type: "biological_mother", person_a_id: 2, person_b_id: 3, since_year: null, until_year: null },
];

const gA = buildFamilyGraph(peopleA, relsA);
printGraph(gA);

const nodeIdsA = gA.nodes.map((n) => n.id);
assert(new Set(nodeIdsA).size === nodeIdsA.length,            "Sin nodos duplicados");
assert(gA.nodes.filter((n) => n.type === "person").length === 3, "3 person nodes");
assert(gA.nodes.filter((n) => n.type === "union").length === 1,  "1 union node");
assert(gA.nodes.some((n) => n.id === "union-1-2"),             "union-1-2 existe");
assert(
  gA.nodes.find((n) => n.id === "union-1-2")?.data?.person_a_id === "1" &&
  gA.nodes.find((n) => n.id === "union-1-2")?.data?.person_b_id === "2",
  'union-1-2 tiene person_a_id="1" y person_b_id="2"'
);

const childEdgeA = gA.edges.find((e) => e.type === "child_of" && e.target === "3");
assert(childEdgeA !== undefined,                               "Edge child_of → '3' existe");
assert(childEdgeA?.source === "union-1-2",                    "Hijo conectado a union-1-2 (no a padre directo)");
assert(
  gA.edges.every((e) => !(e.target === "3" && (e.source === "1" || e.source === "2"))),
  "Sin edges directos padre/madre → hijo"
);
assert(gA.edges.filter((e) => e.type === "spouse").length === 2, "2 spouse edges (uno por persona del par)");
assert(gA.edges.filter((e) => e.type === "child_of").length === 1, "1 child_of edge");

// ─────────────────────────────────────────────────────────────────────────────
// CASE B — Pareja con matrimonio disuelto (until_year NOT NULL)
// Pedro (4) + María (5) — divorced representado como spouse + until_year.
// Son (6) es hijo biológico de ambos.
// Esperado: union-4-5 existe, hijo conectado a él; until_year propagado al edge.
// ─────────────────────────────────────────────────────────────────────────────
section("CASE B — Matrimonio disuelto (until_year NOT NULL) + hijo biológico");

const peopleB = [
  { id: 4, name: "Pedro", gender: "male",   birth_year: 1960, role: "padre" },
  { id: 5, name: "María", gender: "female", birth_year: 1963, role: "madre" },
  { id: 6, name: "Sofía", gender: "female", birth_year: 1992, role: "hija"  },
];

const relsB = [
  { id: 20, type: "spouse",            person_a_id: 4, person_b_id: 5, since_year: 1985, until_year: 2005 },
  { id: 21, type: "biological_father", person_a_id: 4, person_b_id: 6, since_year: null, until_year: null },
  { id: 22, type: "biological_mother", person_a_id: 5, person_b_id: 6, since_year: null, until_year: null },
];

const gB = buildFamilyGraph(peopleB, relsB);
printGraph(gB);

assert(gB.nodes.some((n) => n.id === "union-4-5"),             "union-4-5 existe (matrimonio disuelto también genera union node)");
const spouseEdgeB = gB.edges.find((e) => e.type === "spouse" && e.source === "4");
assert(spouseEdgeB?.until_year === 2005,                       "until_year=2005 preservado en edge spouse");
const childEdgeB = gB.edges.find((e) => e.type === "child_of" && e.target === "6");
assert(childEdgeB?.source === "union-4-5",                     "Hija conectada a union-4-5");

// ─────────────────────────────────────────────────────────────────────────────
// CASE C — Hijo con un solo padre registrado (sin union node)
// Hugo (7) es padre biológico de Mia (8), pero no hay madre registrada.
// Hugo no tiene pareja registrada.
// Esperado: edge directo Hugo → Mia (tipo biological_father), sin union node.
// ─────────────────────────────────────────────────────────────────────────────
section("CASE C — Hijo con un solo padre (sin union node)");

const peopleC = [
  { id: 7, name: "Hugo", gender: "male",   birth_year: 1970, role: "padre" },
  { id: 8, name: "Mia",  gender: "female", birth_year: 2000, role: "hija"  },
];

const relsC = [
  { id: 30, type: "biological_father", person_a_id: 7, person_b_id: 8, since_year: null, until_year: null },
];

const gC = buildFamilyGraph(peopleC, relsC);
printGraph(gC);

assert(gC.nodes.filter((n) => n.type === "union").length === 0, "Sin union nodes (no hay pareja)");
const directEdgeC = gC.edges.find((e) => e.source === "7" && e.target === "8");
assert(directEdgeC !== undefined,                               "Edge directo Hugo → Mia existe");
assert(directEdgeC?.type === "biological_father",              "Tipo del edge es biological_father");
assert(gC.edges.filter((e) => e.type === "child_of").length === 0, "Sin edges child_of (no hay union node)");

// ─────────────────────────────────────────────────────────────────────────────
// CASE D — Persona con múltiples matrimonios y dos hijos de distintas parejas
// Luis (9): casado con Rosa (10) → hijo Tomás (11)
//           casado con Eva (12)  → hijo Clara (13)
// Esperado: 2 union nodes distintos, cada hijo al union node correcto.
// ─────────────────────────────────────────────────────────────────────────────
section("CASE D — Múltiples matrimonios, hijos de distintas parejas");

const peopleD = [
  { id: 9,  name: "Luis",  gender: "male",   birth_year: 1958, role: "padre"  },
  { id: 10, name: "Rosa",  gender: "female", birth_year: 1960, role: "madre"  },
  { id: 11, name: "Tomás", gender: "male",   birth_year: 1985, role: "hijo"   },
  { id: 12, name: "Eva",   gender: "female", birth_year: 1972, role: "madre"  },
  { id: 13, name: "Clara", gender: "female", birth_year: 1998, role: "hija"   },
];

const relsD = [
  { id: 40, type: "spouse",            person_a_id: 9,  person_b_id: 10, since_year: 1980, until_year: 1990 },
  { id: 41, type: "biological_father", person_a_id: 9,  person_b_id: 11, since_year: null, until_year: null },
  { id: 42, type: "biological_mother", person_a_id: 10, person_b_id: 11, since_year: null, until_year: null },
  { id: 43, type: "spouse",            person_a_id: 9,  person_b_id: 12, since_year: 1995, until_year: null },
  { id: 44, type: "biological_father", person_a_id: 9,  person_b_id: 13, since_year: null, until_year: null },
  { id: 45, type: "biological_mother", person_a_id: 12, person_b_id: 13, since_year: null, until_year: null },
];

const gD = buildFamilyGraph(peopleD, relsD);
printGraph(gD);

const nodeIdsD = gD.nodes.map((n) => n.id);
assert(new Set(nodeIdsD).size === nodeIdsD.length,                 "Sin nodos duplicados");
assert(gD.nodes.filter((n) => n.type === "union").length === 2,    "2 union nodes (uno por pareja)");
assert(gD.nodes.some((n) => n.id === "union-9-10"),                "union-9-10 existe (Luis + Rosa)");
assert(gD.nodes.some((n) => n.id === "union-9-12"),                "union-9-12 existe (Luis + Eva)");

const childTomás = gD.edges.find((e) => e.type === "child_of" && e.target === "11");
assert(childTomás?.source === "union-9-10",                        "Tomás conectado a union-9-10 (Luis+Rosa)");

const childClara = gD.edges.find((e) => e.type === "child_of" && e.target === "13");
assert(childClara?.source === "union-9-12",                        "Clara conectada a union-9-12 (Luis+Eva)");

// ─────────────────────────────────────────────────────────────────────────────
// CASE E — Padre adoptivo + madre biológica que son pareja
// Jorge (14) es adoptive_father, Pilar (15) es biological_mother, son cónyuges.
// Hijo adoptado: Noa (16).
// Esperado: union-14-15 existe, Noa conectada a él (aunque los tipos sean distintos).
// ─────────────────────────────────────────────────────────────────────────────
section("CASE E — Padre adoptivo + madre biológica que son cónyuges");

const peopleE = [
  { id: 14, name: "Jorge", gender: "male",   birth_year: 1975, role: "padre" },
  { id: 15, name: "Pilar", gender: "female", birth_year: 1978, role: "madre" },
  { id: 16, name: "Noa",   gender: "female", birth_year: 2005, role: "hija"  },
];

const relsE = [
  { id: 50, type: "spouse",            person_a_id: 14, person_b_id: 15, since_year: 2000, until_year: null },
  { id: 51, type: "adoptive_father",   person_a_id: 14, person_b_id: 16, since_year: null, until_year: null },
  { id: 52, type: "biological_mother", person_a_id: 15, person_b_id: 16, since_year: null, until_year: null },
];

const gE = buildFamilyGraph(peopleE, relsE);
printGraph(gE);

assert(gE.nodes.some((n) => n.id === "union-14-15"),              "union-14-15 existe");
const childNoa = gE.edges.find((e) => e.type === "child_of" && e.target === "16");
assert(childNoa?.source === "union-14-15",                        "Noa conectada a union-14-15 (padres mixtos)");
assert(
  gE.edges.every((e) => !(e.target === "16" && (e.source === "14" || e.source === "15"))),
  "Sin edges directos padre/madre → Noa"
);

// ─────────────────────────────────────────────────────────────────────────────
// CASE F — Mismo par, dos matrimonios (remarriage)
// Esperado: UN SOLO union node por par, aunque haya 2 filas spouse.
// ─────────────────────────────────────────────────────────────────────────────
section("CASE F — Remarriage (mismo par, dos spouse rows)");

const peopleF = [
  { id: 17, name: "Tomás", gender: "male",   birth_year: 1970, role: "padre" },
  { id: 18, name: "Laura", gender: "female", birth_year: 1973, role: "madre" },
];

const relsF = [
  { id: 60, type: "spouse", person_a_id: 17, person_b_id: 18, since_year: 1995, until_year: 2003 },
  { id: 61, type: "spouse", person_a_id: 17, person_b_id: 18, since_year: 2008, until_year: null },
];

const gF = buildFamilyGraph(peopleF, relsF);
printGraph(gF);

assert(gF.nodes.filter((n) => n.type === "union").length === 1,  "Solo 1 union node aunque haya 2 spouse rows");
assert(gF.nodes.some((n) => n.id === "union-17-18"),              "union-17-18 existe");
assert(gF.edges.filter((e) => e.type === "spouse").length === 4, "4 spouse edges (2 por cada spouse row)");

// ─────────────────────────────────────────────────────────────────────────────
// RESUMEN FINAL
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${"═".repeat(64)}`);
console.log(`  RESULTADO FINAL`);
console.log("═".repeat(64));
console.log(`  Pasaron : ${passed}`);
console.log(`  Fallaron: ${failed}`);

if (failed === 0) {
  console.log("\n  ✔  GRAFO VÁLIDO — Todos los casos pasan correctamente.\n");
} else {
  console.log("\n  ✘  GRAFO INVÁLIDO — Casos que fallan:");
  failures.forEach((f) => console.log(`     • ${f}`));
  console.log();
  process.exit(1);
}
