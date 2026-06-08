# Módulo Árbol Genealógico — Galicia Migrante

## 📌 Descripción

Módulo genealógico profesional para construir, visualizar y explorar árboles familiares complejos. Diseñado para estar a la altura de las soluciones más avanzadas del mercado (MyHeritage, FamilySearch, Ancestry) con el objetivo de superarlas.

Este módulo es el **corazón emocional** del ecosistema Galicia Migrante — el primer módulo en nacer y el que sienta las bases técnicas compartidas del portal.

---

## 🌐 Contexto del ecosistema

```
galicia-migrante/
├── portal/              ← compartido por todos los módulos
│   ├── auth/
│   ├── design-system/
│   ├── payments/
│   └── i18n/
├── modulos/
│   ├── arbol/           ← ESTE MÓDULO
│   ├── territorio/      ← futuro
│   ├── comunidad/       ← futuro
│   └── ...
```

Al integrarse al portal expone un único componente raíz:

```jsx
<ArbolGenealogico user={user} plan={plan} />
```

---

## 🖥️ Navegación del módulo

Una sola barra con dos filas, presente en todas las secciones:

**Fila 1 — oscura:**
```
[Logo GM] [Nombre árbol ▾] [⟳ NO-MVP] [📋 NO-MVP] [🧬 NO-MVP]    [👤 Usuario] [✉] [Ayuda] [Español]
```

**Fila 2 — clara:**
```
[Logo GM]    Inicio | Árbol | Descubrimientos | Fotos | Investigación    [♿]
```

**Línea de contexto del árbol:**
```
[Nombre del árbol] | [Persona foco]                    [Vista familiar] [...]
```

**Controles del árbol:**
```
[GENERACIONES: 5+]    [Buscar una persona...]    [⚙] [❓]
```

**Notas:**
- Logo GM ocupa la altura completa de las 2 filas
- "Inicio" lleva al dashboard del módulo — NO al portal
- ADN no existe en GM
- Login y cuenta se gestionan desde el portal

---

## 🎯 Objetivo

Construir el módulo genealógico más completo, eficiente y profesional posible. Cada decisión está tomada con escala de miles de registros en cientos de árboles en mente desde el primer día.

---

## ⚙️ Stack tecnológico

- React + Vite
- CSS Variables — todo en hexadecimal, cero rgba(), cero hardcoding
- Supabase (PostgreSQL)
- GitHub: https://github.com/BetoSP/Clon_de_My_Heritage (branch: master)

---

## 🧩 Modelo del sistema

```
people        → nodos base (personas)
relationships → edges base (relaciones)
union nodes   → nodos derivados en runtime (vínculos de pareja)
child_of      → edges derivados cuando ambos padres son pareja
trees         → árboles familiares del usuario
derived_relationships → tabla precalculada (pendiente)
```

Supabase es la única fuente de verdad. El frontend solo transforma y visualiza.

---

## 🗄️ Tipos de relación

### Vínculos de pareja (COUPLE_TYPES)
```
married, partner, co_parent, separated, divorced, widowed, unknown
```

### Vínculos parentales (PARENT_TYPES)
```
father, mother, adoptive_father, adoptive_mother,
stepfather, stepmother, foster_father, foster_mother
```

### Fraternales
```
brother, sister
```

---

## ⚙️ Estado funcional actual

✔ CRUD completo de personas (name, name_2, surname_1, surname_2, surname_married) y relaciones
✔ Motor de grafo con displayName, displaySurnames, dateDisplay, hasHiddenParents
✔ Layout engine bottom-up con espaciado simétrico
✔ Visualización SVG con pan & zoom
✔ Barra de género en nodo (franja vertical por género)
✔ Símbolos genealógicos (* nacimiento, † fallecimiento)
✔ Abreviación progresiva del nombre (5 niveles)
✔ Bloqueo automático de género en modal
✔ Nodos fantasma con detección de todos los PARENT_TYPES
✔ Click en nodo → foco: centra vista + línea de contexto
✔ Badge de vinculación con lógica correcta
✔ get_subgraph con hermanos, sin ancestros de cónyuges
✔ ModuleNavBar con 2 filas, menú centrado, panel ♿ funcional
✔ ModuleHomePage — dashboard de inicio del módulo
✔ Línea de contexto: [árbol] | [foco] + vistas a la derecha
✔ Controles reorganizados: generaciones | buscar | ⚙ ❓
✔ Design system — todo en variables CSS hexadecimales
✔ Footer minimalista
✔ ProfileDrawer implementado (sidebar de persona, margen izquierdo, 420px)
✔ Edición inline de campos biográficos
✔ Familia inmediata navegable en el drawer (padres, hijos, cónyuge, hermanos)
✔ Disolución y eliminación de pareja desde el drawer
✔ ResizeObserver — variables CSS dinámicas --layout-nav-height y --layout-footer-height
✔ ModuleNavBar y FooterBar con forwardRef
✔ DissolveCell eliminado de GraphView.jsx
✔ PersonModal rediseñado — layout dos columnas, prefijo/sufijo, precisión de fechas, autocompletado de lugares
✔ Campo migration_condition en tabla people y en PersonModal
✔ Fondo del nodo blanco — condición migratoria cambia el fondo con colores suaves
✔ Banda diagonal para personas fallecidas (esquina superior izquierda)
✔ Glow de foco suave via drop-shadow
✔ Click en nodo → centra vista + abre drawer + cambia foco

---

## 📁 Estructura del proyecto

```
src/
├── components/
│   ├── ProfileDrawer.jsx         — sidebar de persona (420px, margen izquierdo)
│   ├── ProfileDrawer.css         — estilos del sidebar
│   ├── GraphView.jsx
│   ├── PersonModal.jsx
│   ├── AddRelativeModal.jsx
│   ├── RelationshipModal.jsx     — pendiente BUG-01
│   ├── ModuleNavBar.jsx          — barra del módulo (2 filas)
│   ├── ModuleHomePage.jsx        — dashboard de inicio
│   ├── TopNavBar.jsx             — huérfano, pendiente eliminar
│   ├── TreeContextBar.jsx        — línea de contexto + vistas
│   ├── TreeControlPanel.jsx      — generaciones + buscar + config
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

## 📚 Documentación interna

- `DECISIONS.md` — decisiones de arquitectura [001]-[041]
- `ENGINE_RULES.md` — reglas del motor de grafo y subgrafo
- `PROJECT_CONTEXT.md` — estado actual, esquemas de DB y pendientes
- `LEGADO_FUTURO.md` — deuda técnica y funcionalidades futuras con submenús NO-MVP detallados
- `CLAUDE.md` — instrucciones base para Claude Code
- `myheritage.md` — referencia técnica completa v3.0

---

## 🚀 Instalación local

```powershell
cd arbol
npm install
npm run dev
```

Crear `arbol/.env`:
```env
VITE_SUPABASE_URL=tu_url
VITE_SUPABASE_KEY=tu_key
```
