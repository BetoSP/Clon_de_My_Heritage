# Módulo Árbol Genealógico — Galicia Migrante

## 📌 Descripción

Módulo genealógico profesional para construir, visualizar y explorar árboles familiares complejos. Diseñado para estar a la altura de las soluciones más avanzadas del mercado (MyHeritage, FamilySearch, Ancestry) con el objetivo de superarlas.

Este módulo es el **corazón emocional** del ecosistema Galicia Migrante — el primer módulo en nacer y el que sienta las bases técnicas compartidas del portal.

---

## 🌐 Contexto del ecosistema

```
galicia-migrante/
├── portal/              ← compartido por todos los módulos
│   ├── auth/            ← autenticación (creado por este módulo)
│   ├── design-system/   ← variables CSS, tipografía, colores
│   ├── payments/        ← planes, límites, feature flags
│   └── i18n/            ← textos en es/gl/en
├── modulos/
│   ├── arbol/           ← ESTE MÓDULO
│   ├── territorio/      ← Tu lugar en Galicia (futuro)
│   ├── comunidad/       ← Asociaciones, micrositios (futuro)
│   └── ...
```

El módulo se desarrolla de forma independiente hasta madurez completa. Al integrarse al portal expone un único componente raíz:

```jsx
<ArbolGenealogico user={user} plan={plan} />
```

---

## 🎯 Objetivo

Construir el módulo genealógico más completo, eficiente y profesional posible. Cada decisión de arquitectura está tomada con escala de miles de registros en cientos de árboles en mente desde el primer día.

---

## ⚙️ Stack tecnológico

- React + Vite
- CSS Variables (design system compatible con portal futuro)
- Supabase (PostgreSQL)
- GitHub: https://github.com/BetoSP/Clon_de_My_Heritage (branch: master)

---

## 🧩 Modelo del sistema

```
people        → nodos base (personas)
relationships → edges base (relaciones)
union nodes   → nodos derivados en runtime (vínculos de pareja)
child_of      → edges derivados cuando ambos padres son pareja
derived_relationships → tabla de relaciones precalculadas (pendiente)
```

Supabase es la única fuente de verdad. El frontend solo transforma y visualiza.

---

## 🗄️ Tipos de relación

### Vínculos de pareja (COUPLE_TYPES — generan union nodes)
```
married, partner, co_parent, separated, divorced, widowed, unknown
```

### Vínculos parentales (PARENT_TYPES — establecen jerarquía)
```
father, mother,
adoptive_father, adoptive_mother,
stepfather, stepmother,
foster_father, foster_mother
```

### Fraternales
```
brother, sister
```

---

## ⚙️ Estado funcional actual

✔ CRUD completo de personas y relaciones
✔ Motor de grafo (buildFamilyGraph)
✔ Layout engine bottom-up (layoutFamilyGraph)
✔ Visualización SVG con pan & zoom
✔ Nodos fantasma para agregar familiares
✔ Buscador de personas existentes (padre, madre, cónyuge)
✔ Tipos de vínculo de pareja explícitos
✔ Foco por subgrafo via RPC get_subgraph
✔ Design system con variables CSS

---

## 📁 Estructura del proyecto

```
src/
├── components/
│   ├── GraphView.jsx         — canvas SVG, pan/zoom, nodos, edges
│   ├── PersonModal.jsx       — modal editar/crear persona
│   ├── AddRelativeModal.jsx  — modal agregar familiar
│   ├── RelationshipModal.jsx — modal editar relaciones
│   ├── TopNavBar.jsx         — (mover a portal/ al integrar)
│   ├── TreeContextBar.jsx
│   └── TreeControlPanel.jsx
├── graph/
│   ├── buildFamilyGraph.js   — transforma datos en grafo
│   ├── layoutFamilyGraph.js  — algoritmo de layout
│   ├── geometry.js           — constantes dimensionales
│   └── relationshipTypes.js  — tipos de relación
├── services/
│   ├── peopleService.js
│   └── relationshipService.js
├── lib/
│   └── supabase.js
├── App.jsx
├── App.css
└── index.css                 — design system (variables CSS)
```

---

## 📚 Documentación interna

- `DECISIONS.md` — decisiones de arquitectura tomadas
- `ENGINE_RULES.md` — reglas del motor de grafo
- `PROJECT_CONTEXT.md` — estado actual y esquema de DB
- `LEGADO_FUTURO.md` — deuda técnica y funcionalidades pendientes
- `CLAUDE.md` — instrucciones base para Claude Code

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
