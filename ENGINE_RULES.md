# ENGINE RULES — Graph System

## Modelo base
- people = nodes base
- relationships = edges base
- graph final = derivado en runtime

---

## Invariantes

1. No existe jerarquía en datos
2. No existe árbol en backend
3. Todo es un grafo dirigido

---

## Union nodes

- Se generan SOLO para relaciones spouse
- ID = min(person_a_id, person_b_id)
- Nunca se persisten en DB
- Son derivados en runtime

---

## Reglas de hijos

Si ambos padres son pareja:
→ el hijo se conecta al union node

Si no:
→ conexión directa al padre correspondiente

---

## Prohibiciones

- No inferir jerarquía visual en backend
- No modificar relationships desde UI lógica
- No crear nodos fuera de buildFamilyGraph

---

## Fuente de verdad

buildFamilyGraph.js es la única transformación válida del sistema