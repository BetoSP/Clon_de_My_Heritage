# Decisiones de arquitectura — Módulo Árbol Genealógico / Galicia Migrante

Registro de decisiones técnicas tomadas durante el desarrollo.
Cada entrada responde: qué se decidió, por qué, qué se descartó y qué impacto tiene en el sistema.

> **Principio rector:** el sistema debe estar a la altura de las soluciones genealógicas más profesionales conocidas (MyHeritage, FamilySearch, Ancestry) con el objetivo de superarlas. Cada decisión de arquitectura debe ser evaluada con escala de miles de registros en cientos de árboles desde el primer día.

---

## [001] TEXT + CHECK en lugar de ENUM para relationship_type

**Decisión:** usar `TEXT` con constraint `CHECK (type IN (...))` en la tabla `relationships`.

**Razón:**
- Agregar un nuevo tipo con ENUM requiere `ALTER TYPE` (problemático en PostgreSQL)
- Con TEXT + CHECK se puede modificar el constraint sin dependencias fuertes
- Compatible con Supabase/PostgREST sin fricción

**Descartado:** `CREATE TYPE relationship_type AS ENUM (...)`

---

## [002] — SUPERSEDIDA por [025]

**Estado:** la decisión original de usar solo `spouse` + `until_year` fue revertida.
Ver decisión [025] para el modelo actual de tipos de relación de pareja.

---

## [003] Orden canónico en relaciones simétricas de pareja

**Decisión:** para todos los tipos de `COUPLE_TYPES`, siempre almacenar:
- `person_a_id < person_b_id`

**Razón:**
- Evita duplicación de parejas invertidas (A–B vs B–A)
- Garantiza unicidad estructural del grafo
- Simplifica queries y generación de union nodes

**Implementación:** `relationshipService.js` aplica `min/max` para todos los `COUPLE_TYPES`.

---

## [004] Arquitectura modular — árbol como módulo del portal

**Decisión:** el árbol genealógico se desarrolla como módulo independiente pero preparado para integrarse al ecosistema Galicia Migrante.

**Estructura del ecosistema:**
```
galicia-migrante/
├── portal/            ← compartido por todos los módulos
│   ├── auth/
│   ├── design-system/
│   ├── payments/
│   └── i18n/
├── modulos/
│   ├── arbol/         ← este módulo
│   ├── territorio/    ← futuro
│   └── ...
```

**Regla de integración:**
- Si el portal ya tiene el componente → el árbol lo hereda
- Si no existe → el árbol lo crea en `portal/` para que lo compartan los módulos futuros

**Lo que hereda del portal:** auth, design system, payments, shell (TopNavBar/Footer), i18n
**Lo que es propio:** motor de grafo, visualización SVG, servicios de datos, modales genealógicos

**Interfaz de integración:**
```jsx
<ArbolGenealogico user={user} plan={plan} />
```

**Razón:**
- El árbol es el primer módulo — sienta las bases compartidas
- Evita reimplementar auth, estilos y pagos en cada módulo
- Permite integración limpia al portal sin reescribir

---

## [005] Relaciones padre → hijo son direccionales

**Decisión:**
- `person_a_id` = progenitor
- `person_b_id` = hijo

**Razón:**
- La relación es inherentemente direccional
- Permite validaciones y constraints por tipo
- Facilita reconstrucción del grafo genealógico

---

## [006] Modelo temporal de relaciones

**Decisión:** todas las relaciones son temporales:
- `since_year` = inicio (NULL = desconocido)
- `until_year` = fin (NULL = activo)
- `end_reason` = causa del fin (ver [026])

**Razón:**
- Permite reconstrucción histórica
- Permite múltiples relaciones en el tiempo
- Base para futuras vistas tipo timeline

---

## [007] — SUPERSEDIDA por [025]

**Estado:** la decisión original de que `spouse` no representa estado civil fue revertida.
Ver [025].

---

## [008] Union nodes como entidades derivadas

**Decisión:** los vínculos de pareja NO existen como entidades persistidas.

Se generan en runtime como:
- Nodos derivados del grafo
- Identificados por `union-${min_id}-${max_id}`
- Generados para todos los tipos en `COUPLE_TYPES`

**Razón:**
- Evita redundancia en base de datos
- Mantiene modelo relacional limpio
- Permite flexibilidad total en visualización

---

## [009] Modelo de grafo como núcleo del sistema

**Decisión:** el sistema se basa en un grafo dirigido:
- `people` → nodos base
- `relationships` → edges base
- `union nodes` → nodos derivados en runtime
- `child_of` → edges derivados desde union nodes cuando aplica

**Razón:**
- Permite representar familias complejas
- Soporta múltiples padres, adopciones y matrimonios históricos
- Base sólida para visualización y búsquedas avanzadas
- Preparado para migración a Neo4j en tercera etapa del portal

---

## [010] Absorción de relaciones parentales en union nodes

**Decisión:** cuando existe una pareja (cualquier `COUPLE_TYPE`), las relaciones parentales duales se reemplazan por `union node → child` (`child_of`).

**Reglas:**
- Si ambos padres están en COUPLE_TYPES → hijo conectado al union node
- Si solo existe un padre/madre → edge directo persona → hijo

---

## [011] Fechas en columnas separadas (día, mes, año)

**Decisión:** almacenar fechas en tres columnas separadas para nacimiento, fallecimiento y matrimonio.

**Razón:**
- Permite registrar fechas parciales (solo año, o año y mes)
- Compatible con datos genealógicos reales
- Facilita búsquedas por rango de año

**Descartado:** columna única de tipo DATE (requiere fecha completa)

---

## [012] CRUD completo en servicios

**Decisión:** los servicios exponen operaciones completas. Los componentes nunca llaman a Supabase directamente.

- `peopleService.js` → fetchPeople, fetchPeopleByIds, addPerson, updatePerson, deletePerson
- `relationshipService.js` → fetchRelationships, fetchRelationshipsByPersonIds, addRelationship, updateRelationship, deleteRelationship, dissolveRelationship

---

## [013] Modales en lugar de formularios en vista principal

**Decisión:** los formularios de carga son modales flotantes.

**Razón:** el árbol siempre es el protagonista de la UI.

---

## [014] Nodos fantasma para agregar familiares

**Decisión:** al hacer click en `+`, aparecen nodos fantasma mostrando solo las relaciones vacantes.

**Reglas:**
- Si ya tiene padre → no muestra "Agregar padre"
- Si ya tiene madre → no muestra "Agregar madre"
- Si ya tiene pareja → muestra "Agregar otra pareja"
- "Agregar hijo/a", "Agregar hermano/a" aparecen siempre

---

## [015] Design system heredado del portal

**Decisión:** el módulo árbol no define colores, tipografía ni espaciado propios. Hereda todo del `portal/design-system/`.

**Mientras el portal no exista:** las variables CSS viven en `index.css` con nombres compatibles con el sistema del portal, listas para ser migradas sin cambios en los componentes.

**Razón:**
- Consistencia visual entre módulos del portal
- Un solo lugar para cambiar la identidad de marca

---

## [016] — SUPERSEDIDA por [027]

**Estado:** la decisión original de usar solo `father`/`mother` con campo `adopted` fue revertida.
Ver [027].

---

## [017] — SUPERSEDIDA por [027]

**Estado:** el campo `adopted` en `people` fue reemplazado por tipos de relación explícitos.
Ver [027].

---

## [018] Apellidos como campo único — SUPERSEDIDA por [020]

---

## [019] Separación de nombre y apellidos

**Decisión:** campos separados: `name`, `surname_1`, `surname_2`, `surname_married`, `surnames` (calculado).

---

## [020] Apellidos estructurados en tres campos

**Decisión:** `surname_1`, `surname_2`, `surname_married` en la tabla `people`. `surnames` es calculado en frontend.

---

## [021] Cálculo automático de surnames en frontend

**Decisión:**
- Mujer con `surname_married`: `surname_1 + " " + surname_2 + " de " + surname_married`
- Todos los demás: `surname_1 + " " + surname_2`

---

## [022] Sugerencia automática de apellidos

**Decisión:** al agregar un hijo/hija:
- `surname_1` del hijo = `surname_1` del padre
- `surname_2` del hijo = `surname_1` de la madre

---

## [023] Nivelación de generaciones de cónyuges en layout

**Decisión:** si dos personas en `COUPLE_TYPES` están en generaciones distintas, ambas se elevan a la mayor. Se repite hasta convergencia.

---

## [024] Layout bottom-up con grupos

**Decisión:** el layout usa dos pasadas:
1. Bottom-up: calcula el ancho del subárbol de cada grupo (persona + cónyuges + hijos)
2. Top-down: asigna posiciones X reales, centrando padres sobre sus hijos

Los grupos se ordenan por año de nacimiento. Dentro de cada grupo: hijo primero, cónyuges a la derecha en orden cronológico.

---

## [025] Tipos de vínculo de pareja explícitos en DB

**Decisión:** tipos específicos que reflejan la realidad del vínculo:
```
married     — matrimonio formal
partner     — pareja de hecho
co_parent   — co-padres sin vínculo formal
separated   — separados
divorced    — divorciados
widowed     — viudo/a (relación terminada por muerte)
unknown     — vínculo desconocido
```

**Razón:** toda la información debe guardarse en la DB para búsquedas y estadísticas.

**Migración:** `UPDATE relationships SET type = 'married' WHERE type = 'spouse';`

---

## [026] Campo end_reason en relationships

**Decisión:** columna `end_reason TEXT CHECK (end_reason IN ('death', 'divorce', 'separation', 'annulment'))`.

**Razón:** registra la causa del fin de la relación — información valiosa para búsquedas históricas.

---

## [027] Tipos de relación parental explícitos en DB

**Decisión:** tipos específicos que reflejan la naturaleza real del vínculo:
```
father, mother                         — biológico
adoptive_father, adoptive_mother       — adoptivo
stepfather, stepmother                 — padrastro/madrastra
foster_father, foster_mother           — tutor/guardián
```

**Razón:** la distinción biológico/adoptivo/legal es relevante para búsquedas y estadísticas. No puede derivarse de un flag booleano.

**Impacto:** el campo `adopted` en `people` queda obsoleto.
**Pendiente:** migración de datos y actualización de constraint en Supabase.

---

## [028] Tabla derived_relationships para búsquedas escalables

**Decisión:** implementar tabla que precalcula relaciones derivadas:
```sql
CREATE TABLE derived_relationships (
  person_a_id       bigint,
  person_b_id       bigint,
  relationship_type text,
  distance          int,
  path              jsonb,
  calculated_at     timestamp
);
```

**Razón:** con miles de registros, navegar el grafo en tiempo real para cada búsqueda es ineficiente. Esta tabla se actualiza en background cuando se modifica una relación.

**Pendiente de implementación.**

---

## [029] Foco por defecto al cargar

**Decisión:** al arrancar sin foco activo, se setea automáticamente el foco en la primera persona cargada.

**Implementación:** `focusInitialized` y `focusWasCleared` en `App.jsx` como `useRef`. Si el usuario limpia el foco explícitamente, no se vuelve a aplicar el foco por defecto.

---

## [030] Desarrollo independiente con integración planificada

**Decisión:** el módulo árbol se desarrolla hasta madurez completa como proyecto independiente. Cuando esté maduro, se integra al portal Galicia Migrante como módulo.

**Razón:**
- El árbol es el corazón emocional del portal — debe llegar maduro a la integración
- Desarrollar árbol + ecosistema en paralelo genera complejidad excesiva
- El árbol es el primer módulo — sienta las bases técnicas del portal

**Condición para integrar:** árbol con CRUD completo, layout estable, GEDCOM, tipos parentales completos, perfil extendido, campos territoriales básicos.

---

## [031] Display de apellidos en nodos del grafo

**Decisión:** en el nodo visual, los apellidos se muestran con lógica distinta a `surnames` del DB:
- Si existe `surname_1` → mostrar `surname_1 + " " + surname_2` (ignorar `surname_married`)
- Si no hay `surname_1` pero hay `surname_married` → mostrar `de surname_married`
- Ninguno → no mostrar línea de apellidos

**Razón:** el campo DB `surnames` incluye `"de [casada]"` para mujeres (útil para búsquedas y nombre completo), pero en el nodo el espacio es limitado y mostrar el apellido de casada junto a los de origen genera líneas muy largas. La información completa sigue disponible en el campo `people.surnames`.

**Implementación:** calculado en `buildFamilyGraph.js` (`node.data.surnames`), distinto de `person.surnames` (campo DB).

**Tipografía:** nombre y apellidos usan las mismas variables CSS (`--node-font-name`, `--node-text-name`) y el mismo peso (`fontWeight="700"`). Decisión del usuario — contradice el spec inicial del Prompt 003 que pedía "sin negrita".

---

## 📌 Regla general del archivo

Este archivo contiene únicamente decisiones técnicas ya tomadas o en proceso de implementación.
Cada decisión debe poder rastrearse en código existente o en SQL ejecutado.
