# Legado Futuro — Módulo Árbol Genealógico / Galicia Migrante

> Este archivo documenta deuda técnica conocida, funcionalidades pendientes e ideas para el futuro.
> NO describe decisiones activas — esas van en DECISIONS.md.

---

## 🎯 Objetivo del módulo

Construir el módulo genealógico más completo, eficiente y profesional posible — a la altura o por encima de MyHeritage, FamilySearch y Ancestry — listo para integrarse al ecosistema Galicia Migrante cuando alcance madurez.

---

## 🌐 Contexto del ecosistema

```
galicia-migrante/
├── portal/              ← compartido (auth, design-system, payments, i18n)
├── modulos/
│   ├── arbol/           ← ESTE MÓDULO
│   ├── territorio/      ← Tu lugar en Galicia
│   ├── comunidad/       ← Asociaciones, micrositios
│   ├── cultura/         ← Biblioteca, memoria oral
│   └── investigacion/   ← Registros históricos
```

---

## 🐛 Bugs conocidos

### [BUG-01] ✅ RESUELTO — CRUD de relaciones inaccesible desde la UI
Resuelto en PROMPT_013. El ProfileDrawer expone la familia inmediata navegable y los botones de disolución/eliminación de pareja.

### [BUG-02] ✅ RESUELTO — Edición de relaciones y disolución de pareja sin UI
Resuelto en PROMPT_013_FIX_A. DissolveCell eliminado de GraphView.jsx. La disolución y eliminación de pareja viven en el ProfileDrawer sección familia inmediata.

### [BUG-03] Pérdida de filiación visual — hijos casados como secundarios (líneas diagonales)
**Causa raíz:** `isSecondaryInGroup` en `layoutFamilyGraph.js` → `getSortedChildren()`.
**Fix correcto:** refactorizar `placeSubtree`. Alcance: 1–2 sesiones dedicadas.

### [BUG-04] Nodos fantasma con coordenadas negativas ocultos
Nodos fantasma parcialmente ocultos cuando el nodo activo está cerca del borde izquierdo.

### [BUG-05] Slider de generaciones no filtra sin foco activo
El slider existe en la UI pero no tiene efecto sin foco activo.

### [BUG-06] Botón de cierre del ghost mode no visible
Al activar el modo fantasma (click en botón + del nodo), no hay forma visible de cancelarlo sin agregar un familiar. Falta un botón de cierre claro.

### [BUG-07] Nodos fantasma aparecen lejos del nodo activo
Los nodos fantasma deberían aparecer en las proximidades del nodo activo, no en el extremo de la pantalla.

### [BUG-08] Doble estado visual violeta inconsistente
El nodo seleccionado (línea punteada violeta) y el nodo foco (borde sólido violeta) pueden quedar en nodos distintos, generando confusión visual al usuario. Revisar sincronización de `selectedNodeId` y `focusPersonId` al hacer click.
**Nota:** la línea punteada fue eliminada temporalmente (ver BUG-10).

### [BUG-09] Indicador visual de foco — solución definitiva pendiente
Resuelto temporalmente con `filter: drop-shadow(0 0 3px var(--color-primary-dark))` via variable `--node-focus-glow`. Pendiente: decidir si el glow es la solución definitiva o si se quiere un indicador adicional.

### [BUG-10] Línea punteada violeta de selección eliminada temporalmente
El bloque `isSelected && !isGhostActive` con `strokeDasharray` fue eliminado de PersonNode. Las variables `--node-selection-bg`, `--node-selection-border`, `--node-selection-dash` quedan en index.css sin uso activo. Pendiente: rediseñar el indicador de selección.

---

## ⚡ Mejoras de performance

### [MEJORA-01] Optimizar recarga de subgrafo al cambiar foco
Actualmente cada click en un nodo dispara una query RPC a Supabase para recargar el subgrafo completo. En árboles grandes esto genera lag perceptible.

**Alternativas a evaluar:**
- Doble click para cambiar foco (single click solo centra la vista y abre el drawer sin recargar)
- Cachear subgrafos ya cargados en memoria
- Cargar el árbol completo una vez y filtrar en frontend según el foco
- Revisar cómo maneja esto MyHeritage

---

## 🖥️ Menú del módulo — items NO-MVP detallados

Los siguientes ítems están reservados pero no implementados. Aparecen en el menú deshabilitados con badge "Próximamente". Basado en análisis exhaustivo de MyHeritage (Junio 2026).

### Submenú Árbol — items NO-MVP
- **Imprima gráficos y libros** — exportación del árbol como PDF/poster y libros genealógicos
- **Línea del tiempo** — cronología de eventos con contexto histórico gallego (tercera etapa)
- **FamilyMap** — mapa geográfico de orígenes y migraciones (tercera etapa, requiere Neo4j)
- **Informe de relaciones** — calcula el parentesco entre dos personas del árbol
- **Fuentes** — gestión de fuentes y citas documentales

### Submenú Descubrimientos — TODO NO-MVP (tercera etapa)
- **Coincidencias por persona (SmartMatch)** — requiere masa crítica de usuarios y motor de matching
- **Coincidencias por fuente (RecordMatch)** — requiere repositorio de registros históricos

### Submenú Fotos — items NO-MVP
- **Dé color a sus fotos** — colorización IA (DeOldify/DDColor) — tercera etapa
- **Repare fotos** — restauración de daños con IA — tercera etapa
- **Deep Nostalgia™** — animación de rostros históricos — tercera etapa
- **LiveMemory™** — videos de homenaje con IA — tercera etapa
- **Scribe AI** — transcripción de documentos manuscritos con IA — tercera etapa
- **Video de Homenaje** — creación de videos conmemorativos — tercera etapa

### Submenú Investigación — TODO NO-MVP (tercera etapa)
- **Busque todos los registros** — motor de búsqueda unificado de registros históricos
- **Catálogo de la Colección** — índice del repositorio propio
- **Nacimiento, Matrimonio y Defunción** — registros civiles y eclesiásticos
- **Registros del Censo** — padrones históricos
- **Árboles familiares** — búsqueda en árboles de otros usuarios
- **Periódicos** — hemeroteca histórica
- **Registros de inmigración** — manifiestos de barcos, CEMLA, AGN
- **Contrate un investigador** — servicio de investigación profesional

### ADN — NO EXISTE EN GM
El módulo ADN de MyHeritage (con submenús: Resumen, Estimación Étnica, Coincidencias de ADN, cM Explainer™, Poblaciones Fundadoras, Mapa étnico, Comprar kits, Privacidad) está completamente fuera del alcance del proyecto Galicia Migrante. No aparece en el menú.

---

## 🔧 Mejoras de base de datos — pendientes

### Trigger de integridad genealógica en Supabase
Función PL/pgSQL que verifica antes de cada INSERT en `relationships`:
- Una persona no puede ser padre/madre de sí misma
- Una persona no puede ser su propio ancestro

### Auditoría de índices en Supabase
- `idx_relationships_person_a` sobre `person_a_id`
- `idx_relationships_person_b` sobre `person_b_id`
- `idx_relationships_type` sobre `type`
- `idx_people_surname_1` sobre `surname_1`
- `idx_people_birth_year` sobre `birth_year`
- `idx_people_birth_place` sobre `birth_place`

### birth_order en relaciones hijo
Campo `birth_order INTEGER` en `relationships` para ordenar hijos explícitamente.

### Migración del campo `adopted`
Obsoleto — ver DECISIONS [027]. Migrar a tipos de relación explícitos.

### Conectar tabla trees con people y relationships
Agregar `tree_id` a las tablas `people` y `relationships` para soporte multi-árbol real.

### Panel ♿ — tamaño de fuente no aplica al SVG
El panel de accesibilidad modifica el tamaño de fuente del DOM pero no afecta el canvas SVG del árbol. Requiere un sistema de temas que propague el cambio al SVG.

---

## 📊 Tabla derived_relationships

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

Permite búsquedas multi-salto eficientes a escala.

---

## 🖥️ Sidebar de persona (ProfileDrawer) — ✅ IMPLEMENTADO

**Implementado en:** PROMPT_013, PROMPT_013_FIX_A, PROMPT_014, PROMPT_014_FIX_A, PROMPT_014_FIX_B

**Estado actual:** funcional. Pendientes de pulir:
- Proporciones visuales (posicionamiento fino)
- Flechita de cierre — pulir detalle visual
- Avatar circular en encabezado
- Subtítulo dinámico (parentesco calculado en lugar de "Este es usted")
- Botones "Perfil" y "Agregar" sin funcionalidad real (placeholders)
- Secciones Descubrimientos, Fotos y Fuentes son placeholders MVP

**Pendiente post-auth:**
- Pedir contraseña antes de eliminar relación
- Tabla de auditoría de eliminaciones

---

## 👤 Sistema de foco completo

- Badge `xN` → popup con lista de contextos → navegar (pendiente)
- Filtro generacional con foco activo (pendiente)

---

## 🌳 Layout avanzado

- Algoritmo Reingold-Tilford completo
- Manejo de ciclos genealógicos (primos que se casan)
- Vista hourglass centrada en una persona
- BranchExtender: botón `+N` para expandir/colapsar ramas

---

## 📥 GEDCOM import/export

- Importación GEDCOM 5.5/5.5.1 tolerante a errores
- Exportación GEDCOM
- Importación/exportación CSV, Excel, JSON

---

## 👤 Perfil extendido de persona

- Evento de emigración/inmigración (barco, puerto, fecha, destino)
- Bautismo + padrinos + madrinas
- Servicio militar
- Múltiples ocupaciones con período
- Educación con institución y título

---

## 🗺️ Campos territoriales gallegos

- Parroquia + aldea + concello como campos estructurados
- Dropdown desde seed IGE (~3.800 parroquias)
- **Identificación por lugar de origen:** "Manuel de Soutolongo" en el nodo

---

## 📅 Precisión de fechas persistida

Columnas `*_date_precision` en `people`. Soportar fechas aproximadas "Circa 1930".

---

## 🖼️ Avatar con fallback diferenciado por género

- MALE → silueta azul-pizarra
- FEMALE → silueta rosa-pastel
- UNKNOWN → silueta gris neutra

---

## 🔍 Búsqueda avanzada

- Full-text search sobre nombres, apellidos, lugares
- Búsqueda fuzzy para variantes ortográficas
- Navegación multi-salto usando `derived_relationships`

---

## ✅ Consistency Checker

Verificación lógica de fechas imposibles, edades implausibles y relaciones circulares.

---

## 🖼️ Fotos de personas

- Almacenamiento en Supabase Storage
- FaceTaggerOverlay con efecto cruzado bidireccional
- Ver especificación completa en `myheritage.md` sección 47

---

## 🔗 Vinculación entre árboles

Una persona en múltiples árboles aparece con badge de vinculación. Smart Matching automático — tercera etapa.

---

## 🔍 Smart Matching (tercera etapa)

```
S_confianza = w1·S_nombre + w2·S_fecha_nacimiento + w3·S_coincidencia_padres
```
Umbral: 85%. Double Metaphone / Soundex adaptado al español y gallego histórico.

---

## 🏗️ Onboarding Wizard (segunda etapa)

Flujo de registro ligado a la creación del primer núcleo familiar. Ver `myheritage.md` sección 49.

---

## 💰 Paywall (segunda etapa)

Límite configurable de personas por plan. El límite aplica sobre el total de personas únicas en todos los árboles del usuario. Blur + modal al alcanzar el límite. Ver `myheritage.md` sección 50.

---

## 📱 Responsividad

Pendiente de implementar cuando el módulo esté funcionalmente completo y antes de integrar al portal.

**Etapa 1 — Tablet (768px+):** drawer, modales y barra funcionales en tablet. El árbol en tablet es usable.
**Etapa 2 — Mobile (360px+):** vista alternativa del árbol para mobile (lista navegable o vista simplificada del SVG).

---

## 🔐 Auditoría de eliminación de relaciones

Cuando el auth del portal esté implementado:
- Pedir contraseña antes de confirmar eliminación de relación de pareja
- Guardar en tabla de log: quién eliminó, qué relación, cuándo, desde qué IP
- Permite revertir eliminaciones maliciosas o accidentales

---

## ⚡ Performance a escala

- React.memo en PersonNode
- Web Workers para cálculo de layout
- Virtualización para árboles masivos

---

## 📊 Registro de conteo de tokens por prompt

Explorar automatización del registro de consumo de tokens por sesión de Claude Code.

---

## 🔐 Autenticación (portal)

El módulo hereda Supabase Auth con roles y feature flags por plan. Recibe `user` y `plan` como props.

---

## 📦 Duplicación de personas

Algoritmo de similitud + UI de confirmación y fusión.

---

## 🌐 Integración al ecosistema Galicia Migrante

**Condición para integrar:** árbol con CRUD completo, barra del módulo, página de inicio, sidebar, GEDCOM, tipos parentales completos, perfil extendido, campos territoriales básicos.

**Módulos futuros:**
- Tu lugar en Galicia
- Comunidad (asociaciones, micrositios)
- Cultura (biblioteca, memoria oral)
- Investigación (registros históricos)
- Neo4j para redes migratorias (tercera etapa)
