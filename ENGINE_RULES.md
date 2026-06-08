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

## Reglas del subgrafo

El subgrafo de una persona foco contiene:

| Quién | ¿Incluido? |
|-------|-----------|
| Foco | ✓ Siempre |
| Ancestros directos del foco (padres, abuelos…) | ✓ Hasta el límite de generaciones |
| Descendientes directos del foco (hijos, nietos…) | ✓ Hasta el límite de generaciones |
| Hermanos del foco (otros hijos de los mismos padres) | ✓ Un nivel |
| Parejas de CUALQUIER nodo del subgrafo | ✓ Como nodos — entran al subgrafo |
| Ancestros de esas parejas | ✗ NO — tienen su propio subgrafo |

**Regla cardinal — parejas sin linaje:**
Las parejas de cualquier nodo del subgrafo SE INCLUYEN como nodos. Los ancestros de esas parejas NO SE INCLUYEN — tienen su propio subgrafo al que se accede mediante el badge de vinculación.

**Ejemplo:**
Si Antonio es el foco y está casado con Dolores → Dolores aparece en el árbol de Antonio. Pero los padres y abuelos de Dolores NO aparecen en el árbol de Antonio — solo se ven cuando Dolores es el foco.

Esta regla aplica a **todas** las parejas de **todos** los nodos del subgrafo: foco, ancestros, descendientes y hermanos.

**Implementación:**
La función SQL `get_subgraph` aplica esta regla excluyendo del resultado a cualquier persona que sea progenitor de una pareja que no pertenece al linaje directo del foco.

---

## Detección de padre/madre en slots vacantes

`getVacantSlots` debe usar `PARENT_TYPES` para detectar si una persona ya tiene padre o madre — no comparaciones de string literales. Un nodo con `adoptive_father` no debe mostrar "Agregar padre".

```javascript
// ✅ Correcto
const hasFather = edges.some((e) => e.target === nodeId && PARENT_TYPES.has(e.type) && e.type.includes("father"));
// ❌ Incorrecto — no cubre tipos extendidos
const hasFather = edges.some((e) => e.target === nodeId && e.type === "father");
```

---

## Campos propagados a node.data

Cada PersonNode en el grafo lleva en `node.data` los siguientes campos del registro `people`:

| Campo | Descripción |
|-------|-------------|
| `name`, `name_2` | Nombres de pila |
| `displayName` | Nombre abreviado para display en el nodo |
| `displaySurnames` | Apellidos para display en el nodo |
| `dateDisplay` | Fechas formateadas con símbolos genealógicos (* †) |
| `birth_year`, `death_year` | Años para cálculo de edad y dateDisplay |
| `gender` | Género — determina color de barra y accentColor |
| `is_alive` | Determina banda diagonal de fallecido en el nodo |
| `migration_condition` | Determina el color de fondo del nodo |
| `hasHiddenParents` | Flag para badge de vinculación |
| `adopted` | Obsoleto — ver DECISIONS [027] |

**Regla:** cualquier campo de `people` que afecte la visualización del nodo debe propagarse explícitamente en `buildFamilyGraph.js`. El motor de grafo es la única fuente de transformación válida.

---

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
