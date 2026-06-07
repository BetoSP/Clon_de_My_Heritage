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

---

## [003] Orden canónico en relaciones simétricas de pareja

**Decisión:** para todos los tipos de `COUPLE_TYPES`, siempre almacenar `person_a_id < person_b_id`.

**Implementación:** `relationshipService.js` aplica `min/max` para todos los `COUPLE_TYPES`.

---

## [004] Arquitectura modular — árbol como módulo del portal

**Decisión:** el árbol genealógico se desarrolla como módulo independiente pero preparado para integrarse al ecosistema Galicia Migrante.

**Regla de integración:**
- Si el portal ya tiene el componente → el árbol lo hereda
- Si no existe → el árbol lo crea en `portal/` para que lo compartan los módulos futuros

**Interfaz de integración:**
```jsx
<ArbolGenealogico user={user} plan={plan} />
```

---

## [005] Relaciones padre → hijo son direccionales

**Decisión:** `person_a_id` = progenitor, `person_b_id` = hijo.

---

## [006] Modelo temporal de relaciones

**Decisión:** `since_year`, `until_year`, `end_reason` en todas las relaciones.

---

## [007] — SUPERSEDIDA por [025]

---

## [008] Union nodes como entidades derivadas

**Decisión:** los vínculos de pareja NO existen como entidades persistidas. Se generan en runtime para todos los tipos en `COUPLE_TYPES`.

---

## [009] Modelo de grafo como núcleo del sistema

**Decisión:** `people` → nodos, `relationships` → edges, `union nodes` → derivados, `child_of` → derivados.

---

## [010] Absorción de relaciones parentales en union nodes

**Decisión:** cuando existe una pareja (cualquier `COUPLE_TYPE`), las relaciones parentales duales se reemplazan por `union node → child` (`child_of`).

---

## [011] Fechas en columnas separadas (día, mes, año)

**Decisión:** almacenar fechas en tres columnas separadas. Permite fechas parciales.

---

## [012] CRUD completo en servicios

**Decisión:** los componentes nunca llaman a Supabase directamente — solo desde `services/`.

---

## [013] Modales en lugar de formularios en vista principal

**Decisión:** formularios de carga son modales flotantes. El árbol siempre es el protagonista de la UI.

---

## [014] Nodos fantasma para agregar familiares

**Decisión:** al hacer click en `+`, aparecen nodos fantasma mostrando solo las relaciones vacantes.

---

## [015] Design system heredado del portal

**Decisión:** el módulo árbol no define colores, tipografía ni espaciado propios. Mientras el portal no exista, las variables CSS viven en `index.css`.

---

## [016] — SUPERSEDIDA por [027]

---

## [017] — SUPERSEDIDA por [027]

---

## [018] — SUPERSEDIDA por [020]

---

## [019] Separación de nombre y apellidos

**Decisión:** campos separados: `name`, `name_2`, `surname_1`, `surname_2`, `surname_married`, `surnames` (calculado).

---

## [020] Apellidos estructurados en tres campos

**Decisión:** `surname_1`, `surname_2`, `surname_married` en la tabla `people`. `surnames` calculado en frontend.

---

## [021] Cálculo automático de surnames en frontend

**Decisión:**
- Mujer con `surname_married`: `surname_1 + " " + surname_2 + " de " + surname_married`
- Todos los demás: `surname_1 + " " + surname_2`

---

## [022] Sugerencia automática de apellidos

**Decisión:** al agregar un hijo/hija: `surname_1` del hijo = `surname_1` del padre; `surname_2` del hijo = `surname_1` de la madre.

---

## [023] Nivelación de generaciones de cónyuges en layout

**Decisión:** si dos personas en `COUPLE_TYPES` están en generaciones distintas, ambas se elevan a la mayor.

---

## [024] Layout bottom-up con grupos

**Decisión:** dos pasadas: bottom-up (anchos) y top-down (posiciones X). Padres centrados sobre sus hijos.

---

## [025] Tipos de vínculo de pareja explícitos en DB

**Decisión:**
```
married, partner, co_parent, separated, divorced, widowed, unknown
```

**Migración:** `UPDATE relationships SET type = 'married' WHERE type = 'spouse';`

---

## [026] Campo end_reason en relationships

**Decisión:** `end_reason TEXT CHECK (end_reason IN ('death', 'divorce', 'separation', 'annulment'))`.

---

## [027] Tipos de relación parental explícitos en DB

**Decisión:**
```
father, mother, adoptive_father, adoptive_mother,
stepfather, stepmother, foster_father, foster_mother
```

**Impacto:** el campo `adopted` en `people` queda obsoleto.

---

## [028] Tabla derived_relationships para búsquedas escalables

**Pendiente de implementación.**

---

## [029] Foco por defecto al cargar

**Decisión:** foco automático en la primera persona. `focusInitialized` y `focusWasCleared` como `useRef` en `App.jsx`.

---

## [030] Desarrollo independiente con integración planificada

**Decisión:** el módulo árbol se desarrolla hasta madurez completa antes de integrarse al portal.

---

## [031] Display de apellidos en nodos del grafo

**Decisión:**
- Si existe `surname_1` → mostrar `surname_1 + " " + surname_2`
- Si no hay `surname_1` pero hay `surname_married` → mostrar `de surname_married`

**Tipografía:** nombre y apellidos con `fontWeight="700"`.

---

## [032] getVacantSlots detecta padre/madre usando PARENT_TYPES

**Decisión:** usar `PARENT_TYPES.has(e.type) && e.type.includes("father/mother")` en lugar de strings literales.

---

## [033] Edición de relaciones y disolución de pareja — diferidas al sidebar

**Decisión:** se implementarán como parte del sidebar de persona al estilo MyHeritage.

---

## [034] Nombre en dos campos separados

**Decisión:** `name` (primer nombre) y `name_2` (segundo nombre, opcional).

**Migración Supabase:**
```sql
ALTER TABLE people ADD COLUMN IF NOT EXISTS name_2 text;
```

---

## [035] Abreviación progresiva del nombre en el nodo

**Decisión:**
```
Nivel 0: María Concepción Sánchez González
Nivel 1: María Concepción Sánchez G.
Nivel 2: María Concepción S. G.
Nivel 3: María C. S. G.
Nivel 4: M. C. S. G.
Nivel 5: M. C. S…  (último recurso)
```

**Implementación:** `computeAbbreviatedName` en `personUtils.js`. Calculado en `buildFamilyGraph.js`.

---

## [036] Barra del módulo genealógico — estructura de dos filas

**Decisión:** una sola barra con dos filas, presente en todas las secciones del módulo.

**Fila 1 — barra oscura:**
- Logo GM — ocupa la altura completa de las 2 filas
- Selector de árbol activo (nombre del árbol + dropdown para cambiar entre árboles)
- 3 iconos NO-MVP deshabilitados con badge "Próximamente":
  - ⟳ Smart Match
  - 📋 Record Match
  - 🧬 Coincidencias de ADN
- Derecha (heredado del portal — placeholder):
  - Avatar + nombre del usuario (solo informativo — login desde el portal)
  - ✉ Mensajes
  - ⓘ Ayuda ▾ (contextual al módulo activo)
  - 🌐 Español ▾ (selector de idioma — aplica a todos los módulos)

**Fila 2 — barra clara:**
- Logo GM (ocupa ambas filas) con texto "GENEALOGÍA" debajo
- Menú centrado: Inicio | Árbol | Descubrimientos | Fotos | Investigación | (sin ADN)
- Extremo derecho: ♿ símbolo de accesibilidad → abre panel flotante

**Panel de accesibilidad ♿:**
Panel flotante superpuesto con:
- Control de tamaño de fuente (- 100% +) + restablecer
- 6 opciones en grilla 2x3: discapacidad visual, daltónicos, ocultar animaciones, vista típica, normalizar fuente, declaración de acceso
- Selector de idioma en rojo al pie
- Se cierra con ✕ o click fuera

**Razón:**
- Un solo menú evita confusión entre contextos
- El logo lleva siempre al portal
- "Inicio" lleva al inicio del módulo genealógico — NO al portal

---

## [037] Página de inicio del módulo genealógico

**Decisión:** la página de inicio (accedida desde "Inicio" en el menú) sigue el modelo de MyHeritage:

- Banner publicitario (colapsa si no hay contenido, botón "Cerrar")
- Nombre del árbol como título grande — definido por el usuario
- Columna izquierda: avatar del dueño + nombre + "Creador del sitio" + estadísticas (personas, fotos) + descripción "Acerca de" + buscador de antepasados
- Columna derecha: "Actividad reciente" — feed cronológico de cambios en el árbol

**Línea de contexto del árbol (debajo de la barra):**
```
[Nombre del árbol] | [Persona foco del render]
```
- El primer elemento es el nombre del árbol (no necesariamente el dueño)
- El segundo es la persona foco actual del render
- Un usuario puede crear el árbol de otra persona

---

## [038] Menú del módulo genealógico — estructura completa con submenús

**Decisión:** estructura completa basada en análisis de MyHeritage:

```
Módulo Genealógico
│
├── Inicio (dashboard del módulo)                    ← MVP
│   ├── Eventos familiares                           ← MVP
│   ├── Estadísticas familiares                      ← MVP
│   └── Miembros del sitio                           ← MVP
│
├── Árbol
│   ├── Mi árbol (vista de linaje)                   ← MVP
│   ├── Mis fotos                                    ← MVP
│   ├── Administre árboles                           ← MVP
│   ├── Imprima gráficos y libros                    ← NO MVP
│   ├── Línea del tiempo                             ← NO MVP
│   ├── FamilyMap                                    ← NO MVP
│   ├── Informe de relaciones                        ← NO MVP
│   └── Fuentes                                      ← NO MVP
│
├── Descubrimientos                                  ← NO MVP
│   ├── Coincidencias por persona (SmartMatch)       ← NO MVP
│   └── Coincidencias por fuente (RecordMatch)       ← NO MVP
│
├── Fotos
│   ├── Mis fotos                                    ← MVP
│   ├── Dé color a sus fotos                         ← NO MVP
│   ├── Repare fotos                                 ← NO MVP
│   ├── Deep Nostalgia™                              ← NO MVP
│   ├── LiveMemory™                                  ← NO MVP
│   ├── Scribe AI                                    ← NO MVP
│   └── Video de Homenaje                            ← NO MVP
│
├── Investigación                                    ← NO MVP
│   ├── Busque todos los registros                   ← NO MVP
│   ├── Catálogo de la Colección                     ← NO MVP
│   ├── Nacimiento, Matrimonio y Defunción           ← NO MVP
│   ├── Registros del Censo                          ← NO MVP
│   ├── Árboles familiares                           ← NO MVP
│   ├── Periódicos                                   ← NO MVP
│   ├── Registros de inmigración                     ← NO MVP
│   └── Contrate un investigador                     ← NO MVP
│
└── [ADN — NO existe en GM]
```

**Notas importantes:**
- ADN no existe en el menú de GM — está fuera del alcance del proyecto
- Los ítems NO-MVP aparecen en el menú pero deshabilitados con badge "Próximamente"
- Los submenús se despliegan al hacer hover/click en el ítem del menú

---

## [039] Vistas del árbol en TreeContextBar (no en TreeControlPanel)

**Decisión:** los iconos de vistas alternativas del árbol (Vista familiar, y NO-MVP) se ubican en el extremo derecho de la línea de contexto — no en la barra de controles.

```
[Nombre árbol] | [Persona foco]          [Vista familiar ▾] [iconos NO-MVP]
```

**Razón:** en MyHeritage las vistas están a la derecha de la línea de contexto, no en la barra de herramientas inferior.

---

## [040] Eliminación de "Agregar persona" y "Limpiar foco" de la barra

**Decisión:**
- El botón "+ Agregar persona" fue eliminado de la barra — no existe en MyHeritage como elemento fijo. Las personas se agregan desde los nodos fantasma del árbol.
- El botón "Limpiar foco" fue eliminado — no existe en MyHeritage. El foco se maneja navegando el árbol naturalmente.

**Nota:** `handleClearFocus` se mantiene en `App.jsx` — puede activarse por otros medios en el futuro.

---

## [041] Controles del árbol reorganizados

**Decisión:** la barra de controles de la vista del árbol queda:
- Izquierda: GENERACIONES: 5+ (slider)
- Centro: [Buscar una persona...] (flex: 1)
- Derecha: ⚙ Configuración | ❓ Ayuda contextual

---

## 📌 Regla general del archivo

Este archivo contiene únicamente decisiones técnicas ya tomadas o en proceso de implementación.
Cada decisión debe poder rastrearse en código existente o en SQL ejecutado.
