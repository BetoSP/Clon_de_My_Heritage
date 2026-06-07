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

### [BUG-01] CRUD de relaciones inaccesible desde la UI
Diferido a la implementación del sidebar completo al estilo MyHeritage.

### [BUG-02] Edición de relaciones y disolución de pareja sin UI
`DissolveCell` definido pero nunca renderizado. Se implementará en el sidebar de persona.

### [BUG-03] Pérdida de filiación visual — hijos casados como secundarios (líneas diagonales)
**Causa raíz:** `isSecondaryInGroup` en `layoutFamilyGraph.js` → `getSortedChildren()`.
**Fix correcto:** refactorizar `placeSubtree`. Alcance: 1–2 sesiones dedicadas.

### [BUG-04] Nodos fantasma con coordenadas negativas ocultos
Nodos fantasma parcialmente ocultos cuando el nodo activo está cerca del borde izquierdo.

### [BUG-05] Slider de generaciones no filtra sin foco activo
El slider existe en la UI pero no tiene efecto sin foco activo.

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

## 🖥️ Sidebar de persona (ProfileDrawer) — próximo bloque de trabajo

Especificación completa en `myheritage.md` sección 45.

**Detonador:** click simple en zona neutra de la tarjeta de persona.

**Contenido:**
- Encabezado: foto 120x120px, nombre, edad, botones [Árbol] y [Editar]
- Datos biográficos con edición inline
- Matrimonios con link al cónyuge
- Familia inmediata navegable (padres, hermanos, cónyuge/s, hijos)
- Eventos de vida cronológicos
- Fuentes y documentos vinculados

**Resuelve:** BUG-01 y BUG-02.

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
