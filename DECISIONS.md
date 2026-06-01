# Decisiones de arquitectura — MyHeritage Clone

Registro de decisiones técnicas tomadas durante el desarrollo.
Cada entrada responde: qué se decidió, por qué, qué se descartó y qué impacto tiene en el sistema.

---

## [001] TEXT + CHECK en lugar de ENUM para relationship_type

**Decisión:** usar `TEXT` con constraint `CHECK (type IN (...))` en la tabla `relationships`.

**Razón:**
- Agregar un nuevo tipo con ENUM requiere `ALTER TYPE` (problemático en PostgreSQL).
- Con TEXT + CHECK: se puede modificar el constraint sin dependencias fuertes.
- Compatible con Supabase/PostgREST sin fricción.

**Descartado:** `CREATE TYPE relationship_type AS ENUM (...)`.

---

## [002] Eliminación del concepto "divorced"

**Decisión:** el sistema NO modela "divorced" como entidad ni tipo de relación.

Las relaciones matrimoniales se representan exclusivamente como:

- `type = 'spouse'`
- `until_year = NULL` → relación activa
- `until_year != NULL` → relación finalizada

**Razón:**
- Evita duplicación semántica (spouse + divorced)
- El estado civil no es un dato estructural del grafo
- La causa de finalización no es relevante para el modelo de datos base
- Simplifica completamente el motor de relaciones

**Descartado:** cualquier tipo `divorced`, `separated`, etc.

---

## [003] Orden canónico en relaciones simétricas (spouse)

**Decisión:** para `type = 'spouse'`, siempre almacenar:

- `person_a_id < person_b_id`

**Razón:**
- Evita duplicación de parejas invertidas (A–B vs B–A)
- Garantiza unicidad estructural del grafo
- Simplifica queries y generación de union nodes

**Implementación:**
En `relationshipService.js`:

- `person_a_id = min(idA, idB)`
- `person_b_id = max(idA, idB)`

---

## [004] Arquitectura modular frontend

**Decisión:** separar responsabilidades:

- `services/` → acceso a Supabase y lógica de datos
- `components/` → UI React
- `App.jsx` → orquestación de estado

**Razón:**
- Evita crecimiento desordenado de lógica en App.jsx
- Permite reutilización de servicios
- Facilita escalabilidad futura del sistema

---

## [005] Relaciones padre → hijo son direccionales

**Decisión:** la dirección de relaciones parentales es fija:

- `person_a_id` = progenitor
- `person_b_id` = hijo

**Razón:**
- La relación biológica/adoptiva es inherentemente direccional
- Permite validaciones y constraints por tipo de relación
- Facilita reconstrucción del grafo genealógico

---

## [006] Modelo temporal de relaciones

**Decisión:** todas las relaciones son temporales:

- `since_year` = inicio
- `until_year` = fin (NULL = activo)

**Razón:**
- Permite reconstrucción histórica
- Permite múltiples relaciones en el tiempo
- Base para futuras vistas tipo timeline

---

## [007] Spouse como relación temporal (no estado)

**Decisión:** `spouse` no representa un estado civil, sino una relación temporal entre dos nodos.

- activo: `until_year IS NULL`
- histórico: `until_year NOT NULL`

**Razón:**
- Permite múltiples matrimonios por persona
- Evita modelar "estado civil" como atributo global
- Unifica modelo relacional basado en edges

**Regla importante:**
El sistema NO modela estado civil en ningún caso.

---

## [008] Union nodes como entidades derivadas

**Decisión:** los matrimonios NO existen como entidades persistidas.

Se generan en runtime como:

- nodos derivados del grafo
- identificados por `union-${min_id}-${max_id}`

**Razón:**
- Evita redundancia en base de datos
- Mantiene modelo relacional limpio
- Permite flexibilidad total en visualización

---

## [009] Modelo de grafo como núcleo del sistema

**Decisión:** el sistema se basa en un grafo dirigido:

- `people` → nodos base
- `relationships` → edges base
- `union nodes` → nodos derivados
- `child_of` → edges derivados desde union nodes cuando aplica

**Razón:**
- Permite representar familias complejas
- Soporta múltiples padres, adopciones y matrimonios históricos
- Base sólida para visualización futura

---

## [010] Absorción de relaciones parentales en union nodes

**Decisión:** cuando existe una pareja (spouse), las relaciones parentales duales se transforman en una única conexión lógica.

### Reglas:

- Si ambos padres están en relación `spouse`:
  → los edges individuales padre/madre → hijo NO se usan directamente
  → se reemplazan por:
    - `union node → child` (`child_of`)

- Si solo existe un padre/madre:
  → se mantiene edge directo persona → hijo

**Razón:**
- Evita duplicación visual en el grafo
- Mantiene consistencia estructural
- Simplifica layout futuro del árbol

---

## [011] Fecha de nacimiento completa en tabla people

**Decisión:** almacenar fecha de nacimiento en tres columnas separadas:

- `birth_day` (integer, opcional)
- `birth_month` (integer, opcional)
- `birth_year` (integer, opcional)

**Razón:**
- Permite registrar fechas parciales (solo año, o año y mes)
- Evita problemas de formato con fechas incompletas
- Compatible con datos genealógicos reales donde la fecha completa no siempre se conoce

**Descartado:** columna única `birth_date` de tipo DATE (requiere fecha completa).

---

## [012] CRUD completo en servicios

**Decisión:** los servicios exponen operaciones completas de lectura, creación, actualización y eliminación.

- `peopleService.js` → fetchPeople, addPerson, updatePerson, deletePerson
- `relationshipService.js` → fetchRelationships, addRelationship, updateRelationship, deleteRelationship, dissolveRelationship

**Razón:**
- Centraliza toda la lógica de acceso a Supabase
- Los componentes nunca llaman a Supabase directamente
- Facilita cambios futuros en el backend

---

## [013] Modales en lugar de formularios en vista principal

**Decisión:** los formularios de carga de personas y relaciones son modales flotantes, no secciones fijas en la pantalla principal.

**Razón:**
- Los formularios fijos ocupaban demasiado espacio y achicaban el canvas del árbol
- Los modales aparecen contextualizados desde el nodo correspondiente
- Mejor experiencia de usuario — el árbol siempre es el protagonista

**Descartado:** formularios fijos en la vista principal (eliminados de App.jsx).

---

## [014] Nodos fantasma para agregar familiares

**Decisión:** al hacer click en el botón `+` de un nodo, aparecen nodos fantasma alrededor mostrando solo las relaciones vacantes.

### Reglas:
- Si ya tiene padre → no muestra "Agregar padre"
- Si ya tiene madre → no muestra "Agregar madre"
- Si ya tiene cónyuge → no muestra "Agregar cónyuge"
- "Agregar hijo/a" aparece siempre
- El fondo se oscurece (overlay semitransparente) para enfocar la atención
- Hacer click en un nodo fantasma abre RelationshipModal con persona y tipo preseleccionados

**Razón:**
- Evita relaciones duplicadas o inválidas
- Contextualiza la acción al nodo seleccionado
- Sigue el modelo de MyHeritage

---

## [015] Design system con variables CSS en :root

**Decisión:** todos los valores visuales del sistema (colores, tipografía, espaciado, radios, sombras, tamaños de componentes) se definen como variables CSS en `index.css` bajo `:root`.

**Razón:**
- Cambio de identidad de marca en un solo archivo
- Elimina colores y valores hardcodeados en componentes
- Facilita mantenimiento y consistencia visual
- `App.css` solo usa variables, nunca valores literales de color o tipografía

**Descartado:** valores hardcodeados en componentes JSX o clases CSS.

---

## [016] Simplificación de tipos de relación parental

**Decisión:** reemplazar los cuatro tipos parentales por dos únicos:

- `father` — padre (sin distinción biológico/adoptivo)
- `mother` — madre (sin distinción biológico/adoptiva)

El estado de adopción se registra en la tabla `people` como campo `adopted` (boolean).

**Razón:**
- Simplifica la carga de datos para el usuario
- Evita decisiones prematuras al registrar una relación
- La distinción biológico/adoptivo es un atributo de la persona, no de la relación

**Migración:**
```sql
UPDATE relationships SET type = 'father' WHERE type IN ('biological_father', 'adoptive_father');
UPDATE relationships SET type = 'mother' WHERE type IN ('biological_mother', 'adoptive_mother');
```

**Descartado:** `biological_father`, `biological_mother`, `adoptive_father`, `adoptive_mother`.

---

## [017] Campo adopted en tabla people

**Decisión:** agregar columna `adopted` (boolean, default false) en la tabla `people`.

**Razón:**
- Permite registrar el estado de adopción sin afectar el modelo del grafo
- Opcional — no es obligatorio completarlo
- Base para futura funcionalidad de padres biológicos alternativos

---

## [018] Apellidos como campo único con sugerencia automática — SUPERSEDIDA por [020]

**Decisión original:** almacenar apellidos en un único campo `surnames` (text, opcional).

**Estado:** supersedida por decisión [020]. El campo `surnames` se mantiene pero ahora es calculado automáticamente por el frontend a partir de los campos estructurados.

---

## [019] Separación de nombre y apellidos en PersonModal

**Decisión:** el modal de persona tiene campos separados para nombre/s y apellido/s.

- `name` → nombre/s de pila
- `surnames` → calculado automáticamente (ver [021])

**Razón:**
- Evita problemas con nombres compuestos (ej: "María José García López")
- Permite búsqueda y visualización por apellido en el futuro
- Más claro semánticamente para el usuario

---

## [020] Apellidos estructurados en tres campos

**Decisión:** reemplazar el campo único `surnames` por tres campos estructurados en la tabla `people`:

- `surname_1` (text, nullable) — primer apellido (paterno normalmente)
- `surname_2` (text, nullable) — segundo apellido (materno normalmente)
- `surname_married` (text, nullable) — apellido de casada (opcional, solo mujeres)

El campo `surnames` se mantiene pero pasa a ser calculado automáticamente por el frontend.

**Razón:**
- El sistema genealógico español usa primer apellido del padre + primer apellido de la madre
- Si un progenitor es desconocido, el apellido conocido se repite dos veces
- Los campos estructurados permiten sugerencia automática precisa basada en `surname_1` de cada progenitor
- Máxima flexibilidad: el usuario puede editar libremente cualquier campo

**Migración Supabase:**
```sql
ALTER TABLE people ADD COLUMN surname_1 text;
ALTER TABLE people ADD COLUMN surname_2 text;
ALTER TABLE people ADD COLUMN surname_married text;
```

**Descartado:** campo único `surnames` como texto libre (decisión [018] supersedida).

---

## [021] Cálculo automático de surnames en frontend

**Decisión:** el campo `surnames` se calcula en el frontend con esta lógica antes de persistir:

- Mujer con `surname_married`: `surname_1 + " " + surname_2 + " de " + surname_married`
- Todos los demás: `surname_1 + " " + surname_2`

La función `computeSurnames(surname_1, surname_2, surname_married, gender)` vive en `AddRelativeModal.jsx` y `PersonModal.jsx`.

**Razón:**
- `surnames` se usa para display en nodos del árbol y títulos de modales
- Calcularlo en frontend evita lógica en la DB
- Un solo punto de verdad por modal

---

## [022] Sugerencia automática de apellidos basada en surname_1

**Decisión:** al agregar un hijo/hija, el sistema sugiere:

- `surname_1` del hijo = `surname_1` del padre
- `surname_2` del hijo = `surname_1` de la madre

La función `getSuggestedSurnames` en `App.jsx` devuelve `{ surname1, surname2 }` y se pasa como props `suggestedSurname1` y `suggestedSurname2` a `AddRelativeModal`.

**Razón:**
- Refleja el sistema de apellidos español
- Agiliza la carga sin imponer restricciones — el usuario puede editar libremente

**Reemplaza:** la lógica anterior que usaba `surnames.split(" ")[0]` sobre el campo de texto libre.

---

## [023] Nivelación de generaciones de cónyuges en layout

**Decisión:** en `layoutFamilyGraph.js`, después de calcular generaciones por ancestros, se aplica un paso de nivelación: si dos cónyuges están en generaciones distintas, ambos se elevan a la mayor.

Se repite hasta convergencia para cubrir cadenas de cónyuges.

**Razón:**
- Un cónyuge sin padres registrados cae en generación 0 por defecto
- Sin nivelación aparece visualmente por encima de su pareja
- La nivelación garantiza que los cónyuges siempre estén en la misma fila

---

## [024] Posicionamiento de cónyuges sin ancestros en layout

**Decisión:** en `layoutFamilyGraph.js`, las personas sin ancestros que tienen cónyuge se posicionan a la derecha de su pareja, respetando el espacio ya ocupado en esa generación.

**Algoritmo:**
1. Primero se posicionan todas las personas con ancestros
2. Luego las sin ancestros: se toma el mayor entre "posición del cónyuge + H_SPACING" y "último X ocupado + H_SPACING"

**Razón:**
- Evita que el cónyuge externo quede al inicio de la fila (X=0)
- Evita superposición con hermanos u otros nodos ya posicionados

---

## 📌 Regla general del archivo

Este archivo contiene únicamente decisiones técnicas ya tomadas.

NO incluye:
- ideas futuras
- roadmap
- diseño conceptual no implementado

Cada decisión debe poder rastrearse en código existente.
