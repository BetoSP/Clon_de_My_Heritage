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
✔ Tipos de vínculo de pareja explícitos (married, partner, co_parent, etc.)
✔ Visualización diferenciada por tipo de relación
✔ co_parent con línea punteada violeta
✔ Foco por defecto en primera persona al cargar
✔ Subgrafo por foco via RPC get_subgraph en Supabase
✔ Barra de contexto con persona foco y botón limpiar foco
✔ Simbolito de link en cónyuges
✔ Badge xN cuando persona aparece en múltiples union nodes
✔ Apellidos estructurados: surname_1, surname_2, surname_married
✔ Sugerencia automática de apellidos basada en progenitores
✔ Design system con variables CSS

---

## 🧠 Modelo mental del sistema

- `people` = nodos del grafo
- `relationships` = edges del grafo
- union nodes = nodos derivados en runtime para cualquier COUPLE_TYPE
- `child_of` = edge derivado cuando ambos padres son pareja
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
| surnames         | text        | calculado en frontend (nombre completo con "de casada"); `node.data.surnames` usa lógica distinta — ver [031] |
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

Devuelve IDs de ancestros, descendientes y cónyuges del focus_id.

---

## 🚧 Pendiente de implementación — en orden de prioridad

### Bugs críticos
- CRUD de relaciones inaccesible desde la UI (modalRelacion nunca se abre)
- Línea co_parent aparece roja en lugar de punteada violeta
- Pérdida de filiación visual cuando un hijo casado es "secundario" en su grupo

### Features pendientes del módulo árbol
- Tipos parentales extendidos en constraint Supabase (adoptive_father, stepfather, etc.)
- Migración del campo `adopted` de people al tipo de relación
- Sistema de foco completo (doble click → centra vista, badge xN → popup de contextos)
- Tabla derived_relationships
- Filtro generacional real sin foco activo
- GEDCOM import/export
- Perfil extendido de persona (emigración, bautismo, servicio militar, ocupaciones)
- Fotos de personas
- Campos territoriales gallegos (parroquia, aldea, concello)
- Consistency Checker
- Precisión de fechas persistida en DB
- Búsqueda avanzada multi-campo
- Algoritmo de layout Reingold-Tilford completo

### Bases compartidas a crear en portal/ (primer módulo las crea)
- `portal/auth/` — autenticación Supabase Auth
- `portal/design-system/` — variables CSS, tipografía, colores
- `portal/payments/` — planes, límites, feature flags
- `portal/i18n/` — textos en es/gl/en
- Footer genérico del portal

---

## 🔮 Roadmap de integración al portal

**Condición para integrar:** árbol con CRUD completo, layout estable, GEDCOM, tipos parentales completos, perfil extendido, campos territoriales básicos.

**Al integrar:**
- El módulo árbol pasa a vivir en `galicia-migrante/modulos/arbol/`
- Auth, design system, payments e i18n se mueven a `galicia-migrante/portal/`
- El módulo expone `<ArbolGenealogico user={user} plan={plan} />`
- Los módulos futuros (territorio, comunidad, cultura) heredan lo que el árbol creó en `portal/`
