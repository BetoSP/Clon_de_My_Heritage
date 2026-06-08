# PROJECT_CONTEXT — Módulo Árbol Genealógico / Galicia Migrante

---

## 🎯 Rol en el ecosistema

El árbol genealógico es el **módulo estrella** del ecosistema Galicia Migrante. Se desarrolla hasta madurez completa como módulo independiente y luego se integra al portal.

**Es el primer módulo en nacer** — sienta las bases compartidas (auth, design system, payments, i18n) que usarán todos los módulos futuros.

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
✔ CRUD completo de personas (incluyendo name_2)
✔ CRUD completo de relaciones
✔ Motor de grafo — buildFamilyGraph (con hasHiddenParents, displayName, displaySurnames, dateDisplay)
✔ Layout engine bottom-up — layoutFamilyGraph
✔ Visualización SVG con pan & zoom
✔ Centrado automático del árbol al cargar
✔ Nodos fantasma para agregar familiares
✔ Modal agregar familiar con buscador en tiempo real
✔ 7 COUPLE_TYPES y 8 PARENT_TYPES implementados
✔ Visualización diferenciada por tipo de relación
✔ Barra de género en nodo (franja vertical 4px por género)
✔ Símbolos genealógicos en fechas (* nacimiento, † fallecimiento)
✔ Abreviación progresiva del nombre en el nodo (5 niveles)
✔ Bloqueo automático de género en modal al seleccionar Padre/Madre
✔ Foco por defecto en primera persona al cargar
✔ Click en nodo → activa foco: centra vista + actualiza línea de contexto
✔ Badge de vinculación con lógica correcta (hasHiddenParents || unionCount > 1)
✔ Subgrafo por foco via RPC get_subgraph (incluye hermanos, excluye ancestros de cónyuges)
✔ Línea de contexto: [Nombre del árbol] | [Persona foco] + vistas a la derecha
✔ Apellidos estructurados: surname_1, surname_2, surname_married
✔ computeDisplaySurnames, computeFullSurnames, computeAbbreviatedName en personUtils.js
✔ Design system con variables CSS — cero valores hardcodeados — solo hex
✔ Constantes dimensionales en geometry.js
✔ Espaciado simétrico entre generaciones
✔ getVacantSlots detecta todos los PARENT_TYPES
✔ Footer minimalista implementado
✔ ModuleNavBar implementado (2 filas, logo ocupa ambas, menú centrado)
✔ Panel de accesibilidad ♿ funcional
✔ Página de inicio del módulo (ModuleHomePage — dashboard)
✔ Tabla `trees` en Supabase con RLS
✔ ProfileDrawer implementado (sidebar de persona, margen izquierdo, 420px)
✔ Edición inline de campos biográficos (birth/death place, fechas)
✔ Familia inmediata navegable en el drawer (padres, hijos, cónyuge, hermanos)
✔ Disolución y eliminación de pareja desde el drawer
✔ ResizeObserver en App.jsx — variables CSS dinámicas --layout-nav-height y --layout-footer-height
✔ ModuleNavBar y FooterBar con forwardRef
✔ DissolveCell eliminado de GraphView.jsx
✔ PersonModal rediseñado — layout dos columnas, prefijo/sufijo, precisión de fechas, autocompletado de lugares
✔ Campo migration_condition en tabla people (SQL ejecutado) y en PersonModal
✔ Fondo del nodo blanco por defecto — condición migratoria cambia el fondo con colores suaves
✔ Banda diagonal en esquina superior izquierda para personas fallecidas
✔ Glow de foco (drop-shadow suave) — no pisa color de condición migratoria
✔ Click en nodo → centra vista + abre drawer + cambia foco
✔ fetchDistinctPlaces en peopleService — autocompletado de lugares desde DB

---

## 🧠 Modelo mental del sistema

- `people` = nodos del grafo
- `relationships` = edges del grafo
- union nodes = nodos derivados en runtime para cualquier COUPLE_TYPE
- `child_of` = edge derivado cuando ambos padres son pareja
- `node.data.hasHiddenParents` = flag para badge de vinculación
- `node.data.displayName` = nombre abreviado para display en nodo
- `node.data.displaySurnames` = apellidos para display en nodo
- `node.data.dateDisplay` = fechas formateadas con símbolos genealógicos
- `derived_relationships` = tabla de relaciones precalculadas (pendiente)

---

## 🖥️ Navegación y estructura del módulo

### Barra del módulo (2 filas, presente en todas las secciones)

**Fila 1 — barra oscura:**
- Logo GM (ocupa altura de ambas filas)
- Selector de árbol activo + dropdown
- 3 iconos NO-MVP deshabilitados: Smart Match | Record Match | ADN
- Derecha (portal): usuario | ✉ | Ayuda | Español

**Fila 2 — barra clara:**
- Menú centrado: Inicio | Árbol | Descubrimientos | Fotos | Investigación
- Extremo derecho: ♿ → panel de accesibilidad

### Línea de contexto del árbol
```
[Nombre del árbol] | [Persona foco]          [Vista familiar] [vistas NO-MVP]
```

### Controles del árbol
```
[GENERACIONES: 5+]    [Buscar una persona...]    [⚙] [❓]
```

### Página de inicio del módulo (Inicio)
- Banner publicitario (colapsa si no hay)
- Nombre del árbol como título grande
- Col. izquierda: dueño + estadísticas + descripción + buscador
- Col. derecha: actividad reciente

---

## 🗄️ Esquema tabla people (actual)

| columna          | tipo        | notas                             |
|------------------|-------------|-----------------------------------|
| id               | bigint      | PK                                |
| name             | text        | NOT NULL — primer nombre de pila  |
| name_2           | text        | segundo nombre de pila (opcional) |
| surname_1        | text        | primer apellido                   |
| surname_2        | text        | segundo apellido                  |
| surname_married  | text        | apellido de casada (opcional)     |
| surnames         | text        | calculado en frontend             |
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
| migration_condition | text     | CHECK ('galicia_born','galicia_emigrated','diaspora_born','returned','no_galician_roots') |
| created_at       | timestamptz |                                   |

---

## 🗄️ Esquema tabla trees (actual)

| columna    | tipo        | notas                          |
|------------|-------------|--------------------------------|
| id         | bigint      | PK                             |
| name       | text        | nombre del árbol (editable)    |
| owner_name | text        | nombre del dueño               |
| created_at | timestamptz |                                |

RLS habilitado. Un usuario puede tener múltiples árboles. El límite del plan aplica sobre el total de personas únicas en todos sus árboles.

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

### Tipos válidos

**COUPLE_TYPES:** `married`, `partner`, `co_parent`, `separated`, `divorced`, `widowed`, `unknown`

**PARENT_TYPES:** `father`, `mother`, `adoptive_father`, `adoptive_mother`, `stepfather`, `stepmother`, `foster_father`, `foster_mother`

**Fraternales:** `brother`, `sister`

---

## 🗄️ RPC Supabase

```sql
get_subgraph(focus_id bigint, generations_up int, generations_down int)
RETURNS TABLE(person_id bigint)
```

Devuelve: ancestros, descendientes, hermanos y cónyuges del foco. **No incluye ancestros de los cónyuges.** Si `generations_up/down >= 10` → sin límite.

---

## 📁 Estructura de archivos

```
src/
├── components/
│   ├── ProfileDrawer.jsx         — sidebar de persona (420px, margen izquierdo)
│   ├── ProfileDrawer.css         — estilos del sidebar
│   ├── GraphView.jsx
│   ├── PersonModal.jsx
│   ├── AddRelativeModal.jsx
│   ├── RelationshipModal.jsx     — inaccesible (BUG-01, diferido al sidebar)
│   ├── ModuleNavBar.jsx          — barra del módulo (2 filas)
│   ├── ModuleHomePage.jsx        — página de inicio del módulo
│   ├── TopNavBar.jsx             — huérfano, pendiente eliminar
│   ├── TreeContextBar.jsx        — línea de contexto + vistas
│   ├── TreeControlPanel.jsx      — generaciones + buscar + config + ayuda
│   └── FooterBar.jsx
├── graph/
│   ├── buildFamilyGraph.js
│   ├── layoutFamilyGraph.js
│   ├── geometry.js
│   └── relationshipTypes.js
├── services/
│   ├── peopleService.js
│   └── relationshipService.js
├── utils/
│   └── personUtils.js
├── lib/
│   └── supabase.js
├── App.jsx
├── App.css
└── index.css
```

---

## 🚧 Pendiente de implementación — en orden de prioridad

### Inmediato
- Submenús desplegables en el menú del módulo
- Avatar con fallback diferenciado por género (3 siluetas)
- Sidebar de persona (ProfileDrawer) — resuelve BUG-01 y BUG-02
- Eliminar TopNavBar.jsx (huérfano)

### Base de datos
- Trigger de integridad genealógica en Supabase
- Auditoría y creación de índices faltantes
- Migración del campo `adopted` al tipo de relación
- Tipos parentales extendidos en constraint Supabase
- Conectar tabla `trees` con `people` y `relationships` (tree_id)

### Features del módulo
- Sistema de foco completo (badge xN → popup de contextos)
- Tabla derived_relationships
- Filtro generacional real sin foco activo
- GEDCOM import/export
- Perfil extendido (emigración, bautismo, servicio militar)
- Fotos de personas
- Campos territoriales gallegos
- Consistency Checker
- Precisión de fechas persistida en DB
- birth_order en relaciones hijo
- Búsqueda avanzada multi-campo

### Bugs pendientes
- BUG-01: ✅ Resuelto — CRUD de relaciones (ProfileDrawer)
- BUG-02: ✅ Resuelto — DissolveCell (ProfileDrawer)
- BUG-03: Líneas diagonales en hijos casados
- BUG-04: Nodos fantasma con coordenadas negativas
- BUG-05: Slider de generaciones sin foco
- BUG-06: Botón de cierre del ghost mode no visible
- BUG-07: Nodos fantasma aparecen lejos del nodo activo
- BUG-08: Doble estado visual violeta inconsistente
- BUG-09: Indicador visual de foco — solución definitiva pendiente
- BUG-10: Línea punteada de selección eliminada temporalmente

### Bases compartidas a crear en portal/
- `portal/auth/`
- `portal/design-system/`
- `portal/payments/`
- `portal/i18n/`

---

## 🔮 Roadmap de integración al portal

**Condición para integrar:** árbol con CRUD completo, barra del módulo, página de inicio, sidebar, GEDCOM, tipos parentales completos, perfil extendido, campos territoriales básicos.

**Al integrar:**
- El módulo pasa a `galicia-migrante/modulos/arbol/`
- Auth, design system, payments e i18n se mueven a `galicia-migrante/portal/`
- El módulo expone `<ArbolGenealogico user={user} plan={plan} />`
