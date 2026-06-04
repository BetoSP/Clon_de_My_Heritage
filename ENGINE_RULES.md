# ENGINE RULES — Motor de Grafo Genealógico
## Módulo Árbol / Galicia Migrante

> **Principio rector:** el sistema debe estar a la altura de las soluciones genealógicas más profesionales conocidas. Cada decisión debe ser evaluada con escala de miles de registros en cientos de árboles desde el primer día.

---

## Modelo base

- `people` = nodos base
- `relationships` = edges base
- graph final = derivado en runtime por `buildFamilyGraph.js`

---

## Invariantes

1. No existe jerarquía en datos — solo un grafo dirigido
2. No existe árbol en backend — el árbol es una vista del grafo
3. Supabase es la única fuente de verdad
4. El frontend solo transforma y visualiza — nunca infiere ni completa datos
5. Toda la información debe guardarse en la DB — ningún dato es demasiado pequeño o insignificante
6. El módulo nunca reimplementa lo que existe en `portal/` — lo hereda

---

## COUPLE_TYPES — Vínculos de pareja

Tipos que generan union nodes:
```
married, partner, co_parent, separated, divorced, widowed, unknown
```

- Se generan union nodes para TODOS estos tipos
- ID del union node = `union-${min(person_a_id, person_b_id)}-${max(...)}`
- Nunca se persisten en DB — son derivados en runtime
- Orden canónico: `person_a_id < person_b_id` siempre

---

## PARENT_TYPES — Vínculos parentales

Tipos que establecen jerarquía generacional:
```
father, mother,
adoptive_father, adoptive_mother,
stepfather, stepmother,
foster_father, foster_mother
```

- `person_a_id` = progenitor (rol activo)
- `person_b_id` = hijo (sujeto)
- La dirección es siempre progenitor → hijo

---

## Reglas de hijos

Si ambos padres están en `COUPLE_TYPES` entre sí:
→ el hijo se conecta al union node via `child_of`

Si solo existe un padre/madre:
→ conexión directa persona → hijo

---

## Relaciones derivadas

Las siguientes relaciones NO se guardan directamente — se calculan navegando el grafo:
- `son`, `daughter` — inverso de father/mother
- `stepbrother`, `stepsister` — hijos de distintos progenitores unidos por pareja
- `grandfather`, `grandmother` — dos saltos hacia arriba
- `grandson`, `granddaughter` — dos saltos hacia abajo
- `uncle`, `aunt`, `nephew`, `niece`, `cousin` — navegación lateral

Para búsquedas eficientes a escala, estas relaciones se precalculan en `derived_relationships`.

---

## Prohibiciones

- NO inferir jerarquía visual en backend
- NO crear nodos fuera de `buildFamilyGraph.js`
- NO llamar a Supabase directamente desde componentes — solo desde `services/`
- NO usar flags booleanos en `people` para información que pertenece al tipo de relación
- NO hardcodear valores visuales — solo variables CSS del portal
- NO reimplementar en el módulo lo que existe en `portal/`

---

## Fuentes de verdad

- `buildFamilyGraph.js` — única transformación válida del grafo
- `layoutFamilyGraph.js` — única fuente de posiciones visuales
- `relationshipTypes.js` — única fuente de tipos válidos de relación
- `geometry.js` — única fuente de constantes dimensionales
- `portal/design-system/` — única fuente de variables CSS

---

## Preparación para integración al portal

El motor está diseñado para integrarse al ecosistema Galicia Migrante:

- **Auth:** agnóstico — recibe `user` como prop, no implementa login propio
- **Estilos:** variables CSS con nombres compatibles con el design system del portal
- **Rutas:** relativas — no absolutas
- **Estado:** encapsulado — no acoplado al resto del portal
- **Neo4j (tercera etapa del portal):** el modelo de grafo actual es directamente exportable a Neo4j — cada `people` es un nodo, cada `relationships` es una arista
