# PROJECT_CONTEXT — Módulo Árbol Genealógico / Galicia Migrante

---

## 🎯 Rol en el ecosistema

El árbol genealógico es el **módulo estrella** del ecosistema Galicia Migrante — el más emocional y el que más engancha a los usuarios. Se desarrolla hasta madurez completa como módulo independiente y luego se integra al portal.

**Es el primer módulo en nacer** — tiene la responsabilidad de sentar las bases compartidas (auth, design system, payments, i18n) que usarán todos los módulos futuros.

---

## ⚙️ Stack tecnológico

- React + Vite
- CSS Variables (design system propio, compatible con portal futuro)
- Supabase (PostgreSQL)
- GitHub: https://github.com/BetoSP/Clon_de_My_Heritage (branch: master)

---

## ⚙️ Estado funcional actual

✔ React + Vite funcionando
✔ Supabase conectado
✔ CRUD completo de personas
✔ CRUD completo de relaciones
✔ Motor de grafo — buildFamilyGraph
✔ Layout engine bottom-up — layoutFamilyGraph
✔ Visualización SVG con pan & zoom
✔ Centrado automático del árbol al cargar
✔ Nodos fantasma para agregar familiares
✔ Modal agregar familiar con buscador en tiempo real
✔ Buscador de persona existente para padre, madre y cónyuge
✔ Tipos de vínculo de pareja explícitos (married, partner, co_parent, separated, divorced, widowed, unknown)
✔ PARENT_TYPES extendidos (father, mother, adoptive_father, adoptive_mother, stepfather, stepmother, foster_father, foster_mother)
✔ Visualización diferenciada por tipo de relación
✔ co_parent con línea punteada violeta
✔ Foco por defecto en primera persona al cargar
✔ Click en nodo → activa foco: centra vista + actualiza barra de contexto
✔ Badge de vinculación con lógica correcta (hasHiddenParents || unionCount > 1)
✔ Subgrafo por foco via RPC get_subgraph en Supabase
✔ get_subgraph incluye ancestros, descendientes, hermanos y cónyuges (sin ancestros de cónyuges)
✔ Barra de contexto con persona foco, persona seleccionada y botón limpiar foco
✔ Apellidos estructurados: surname_1, surname_2, surname_married
✔ Apellidos en nodo: lógica display (surname_1+surname_2 o "de surname_married")
✔ computeDisplaySurnames centralizado en personUtils.js
✔ computeFullSurnames centralizado en personUtils.js
✔ Sugerencia automática de apellidos basada en progenitores
✔ Design system con variables CSS — cero valores hardcodeados
✔ Constantes dimensionales en geometry.js
✔ Espaciado simétrico entre generaciones (gap padre→línea = gap línea→hijo)
✔ getVacantSlots detecta todos los PARENT_TYPES (adoptive, step, foster)
✔ Footer minimalista implementado
✔ Regla del subgrafo documentada en ENGINE_RULES.md

---

## 🧠 Modelo mental del sistema

- `people` = nodos del grafo
- `relationships` = edges del grafo
- union nodes = nodos derivados en runtime para cualquier COUPLE_TYPE
- `child_of` = edge derivado cuando ambos padres son pareja
- `node.data.hasHiddenParents` = flag calculado en buildFamilyGraph para el badge de vinculación
- `node.data.surnames` = apellidos calculados para display en nodo (distinto de `people.surnames` en DB)
- `derived_relationships` = tabla de relaciones precalculadas (pendiente)

---

## 🗄️ Esquema tabla people (actual)

| columna          | tipo        | notas                             |
|------------------|-------------|-----------------------------------|
| id               | bigint      | PK                                |
| name             | text        | NOT NULL                          |
| surname_1        | text        | primer apellido                   |
| surname_2        | text        | segundo apellido                  |
| surname_married  | text        | apellido de casada (opcional)     |
| surnames         | text        | calculado en frontend — nombre completo con "de casada". `node.data.surnames` usa lógica distinta — ver DECISIONS [031] |
| prefix           | text        | opcional                          |
| suffix           | text        | opcional                          |
| birth_day        | integer     | opcional                          |
| birth_month      | integer     | opcional                          |
| birth_year       | integer     | opcional                          |
| birth_place      | text        | opcional                          |
| gender           | text        |                                   |
| adopted          | boolean     | obsoleto — ver DECISIONS [027]    |
| is_alive         | boolean     | default true                      |
| death_day        | integer     | opcional                          |
| death_month      | integer     | opcional                          |
| death_year       | integer     | opcional                          |
| death_place      | text        | opcional                          |
| death_cause      | text        | opcional                          |
| burial_place     | text        | opcional                          |
| created_at       | timestamptz |                                   |

---

## 🗄️ Esquema tabla relationships (actual)

| columna        | tipo        | notas                                              |
|----------------|-------------|----------------------------------------------------|
| id             | bigint      | PK                                                 |
| person_a_id    | bigint      | FK → people. Para COUPLE_TYPES: min(a,b)           |
| person_b_id    | bigint      | FK → people. Para COUPLE_TYPES: max(a,b)           |
| type           | text        | CHECK (ver tipos abajo)                            |
| since_year     | integer     | opcional                                           |
| until_year     | integer     | NULL = activo                                      |
| end_reason     | text        | CHECK ('death','divorce','separation','annulment') |
| notes          | text        | opcional                                           |
| marriage_place | text        | opcional                                           |
| marriage_day   | integer     | opcional                                           |
| marriage_month | integer     | opcional                                           |
| marriage_year  | integer     | opcional                                           |
| created_at     | timestamptz |                                                    |

### Tipos válidos en relationships.type

**COUPLE_TYPES** (generan union nodes):
`married`, `partner`, `co_parent`, `separated`, `divorced`, `widowed`, `unknown`

**PARENT_TYPES** (establecen jerarquía generacional):
`father`, `mother`, `adoptive_father`, `adoptive_mother`, `stepfather`, `stepmother`, `foster_father`, `foster_mother`

**Fraternales:**
`brother`, `sister`

---

## 🗄️ RPC Supabase

```sql
get_subgraph(focus_id bigint, generations_up int, generations_down int)
RETURNS TABLE(person_id bigint)
```

Devuelve IDs de: ancestros del foco, descendientes del foco, hermanos del foco, y cónyuges de todos los anteriores. **No incluye ancestros de los cónyuges** — regla cardinal documentada en ENGINE_RULES.md. Si `generations_up` o `generations_down` >= 10, se trata como sin límite.

---

## 📁 Estructura de archivos relevante

```
src/
├── components/
│   ├── GraphView.jsx         — canvas SVG, pan/zoom, nodos, edges, badge
│   ├── PersonModal.jsx       — modal editar/crear persona
│   ├── AddRelativeModal.jsx  — modal agregar familiar
│   ├── RelationshipModal.jsx — modal editar relaciones (inaccesible — BUG-01)
│   ├── TopNavBar.jsx
│   ├── TreeContextBar.jsx    — barra de contexto con foco y selección
│   ├── TreeControlPanel.jsx
│   └── FooterBar.jsx         — footer minimalista
├── graph/
│   ├── buildFamilyGraph.js   — transforma datos en grafo; calcula hasHiddenParents
│   ├── layoutFamilyGraph.js  — algoritmo de layout bottom-up
│   ├── geometry.js           — constantes dimensionales (sin hardcoding)
│   └── relationshipTypes.js  — COUPLE_TYPES, PARENT_TYPES, PARENT_EDGE_TYPES
├── services/
│   ├── peopleService.js
│   └── relationshipService.js
├── utils/
│   └── personUtils.js        — computeDisplaySurnames, computeFullSurnames
├── lib/
│   └── supabase.js
├── App.jsx
├── App.css
└── index.css                 — design system (variables CSS)
```

---

## 🚧 Pendiente de implementación — en orden de prioridad

### Inmediato (próximos prompts)
- Barra de género en nodo (franja vertical 4px, color por género)
- Truncado de nombre con ellipsis (~22 caracteres)
- Símbolos `*` y `†` en fechas del nodo
- Avatar con fallback diferenciado por género (3 siluetas)
- Bloqueo automático de género en modal al seleccionar Padre/Madre
- Sidebar de persona (ProfileDrawer) — resuelve también BUG-01 y BUG-02

### Base de datos
- Trigger de integridad genealógica en Supabase
- Auditoría y creación de índices faltantes
- Migración del campo `adopted` al tipo de relación (DECISIONS [027])
- Tipos parentales extendidos en constraint Supabase

### Features del módulo
- Sistema de foco completo (badge xN → popup de contextos)
- Tabla derived_relationships
- Filtro generacional real sin foco activo
- GEDCOM import/export
- Perfil extendido (emigración, bautismo, servicio militar, ocupaciones)
- Fotos de personas
- Campos territoriales gallegos (parroquia, aldea, concello)
- Consistency Checker
- Precisión de fechas persistida en DB
- birth_order en relaciones hijo
- Búsqueda avanzada multi-campo

### Bugs pendientes
- BUG-01: CRUD de relaciones inaccesible (diferido al sidebar)
- BUG-02: DissolveCell sin UI (diferido al sidebar)
- BUG-03: Pérdida de filiación en hijos casados — líneas diagonales (1-2 sesiones)
- BUG-04: Nodos fantasma con coordenadas negativas ocultos
- BUG-05: Slider de generaciones sin efecto sin foco activo

### Bases compartidas a crear en portal/
- `portal/auth/` — autenticación Supabase Auth
- `portal/design-system/` — variables CSS, tipografía, colores
- `portal/payments/` — planes, límites, feature flags
- `portal/i18n/` — textos en es/gl/en

---

## 🔮 Roadmap de integración al portal

**Condición para integrar:** árbol con CRUD completo, layout estable, GEDCOM, tipos parentales completos, perfil extendido, campos territoriales básicos.

**Al integrar:**
- El módulo árbol pasa a vivir en `galicia-migrante/modulos/arbol/`
- Auth, design system, payments e i18n se mueven a `galicia-migrante/portal/`
- El módulo expone `<ArbolGenealogico user={user} plan={plan} />`
- Los módulos futuros (territorio, comunidad, cultura) heredan lo que el árbol creó en `portal/`
