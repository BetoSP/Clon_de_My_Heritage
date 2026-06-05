# CLAUDE.md — Instrucciones base para Claude Code
## Galicia Migrante — Módulo Árbol Genealógico
**Leer antes de cualquier acción.**

---

## 🎯 Objetivo del proyecto

Construir el módulo genealógico más completo, eficiente y profesional posible — a la altura o por encima de MyHeritage, FamilySearch y Ancestry.

Este módulo es el **corazón emocional** del ecosistema Galicia Migrante. Es el primer módulo en nacer y tiene la responsabilidad de sentar las bases compartidas que usarán todos los módulos futuros.

---

## 📚 PASO 1 — Leer antes de ejecutar cualquier prompt

Antes de escribir una sola línea de código, leer OBLIGATORIAMENTE estos archivos en orden:

1. `DECISIONS.md` — decisiones de arquitectura tomadas. No contradecirlas sin discutirlo primero.
2. `ENGINE_RULES.md` — reglas del motor de grafo. Son invariantes — no se violan.
3. `PROJECT_CONTEXT.md` — estado actual del sistema y esquema de DB.
4. `LEGADO_FUTURO.md` — deuda técnica y funcionalidades pendientes.

Si alguno está desactualizado, señalarlo antes de continuar.

---

## 🏗️ Arquitectura del ecosistema

El árbol genealógico es un módulo de un ecosistema mayor: **Galicia Migrante**.

```
galicia-migrante/
├── portal/                    ← compartido por todos los módulos
│   ├── auth/                  ← autenticación (Supabase Auth)
│   ├── design-system/         ← variables CSS, tipografía, colores
│   ├── payments/              ← planes, límites, feature flags
│   └── i18n/                  ← textos en es/gl/en
├── modulos/
│   ├── arbol/                 ← ESTE PROYECTO
│   ├── territorio/            ← futuro
│   ├── comunidad/             ← futuro
│   ├── cultura/               ← futuro
│   └── investigacion/         ← futuro
```

### Regla de oro de integración

- **Si el portal ya tiene el componente** → el árbol lo hereda, no lo reimplementa.
- **Si el portal no lo tiene todavía** → el árbol lo crea en `portal/` desde el primer día, listo para que los módulos hermanos lo usen.

### Lo que hereda del portal (no implementa propio)
- Sistema de autenticación — login, sesión, roles
- Design system — variables CSS, tipografía, colores, espaciado
- Sistema de pagos — planes, límites, feature flags
- Shell del portal — TopNavBar, Footer
- Internacionalización — objeto I18N con es/gl/en

### Lo que es completamente propio del módulo árbol
- Motor de grafo (`buildFamilyGraph`, `layoutFamilyGraph`)
- Visualización SVG (`GraphView`)
- Servicios de datos (`peopleService`, `relationshipService`)
- Modales genealógicos
- Lógica de foco, subgrafo, pan/zoom
- Tablas `people` y `relationships` en Supabase

### Interfaz de integración
El módulo expone al portal un único componente raíz:
```jsx
<ArbolGenealogico user={user} plan={plan} />
```
El portal no necesita saber qué hay adentro.

---

## 🏗️ Principios de arquitectura

- El sistema debe escalar a miles de registros en cientos de árboles desde el primer día
- El sistema debe estar a la altura de las soluciones genealógicas más profesionales conocidas
- Toda la información se guarda en la DB — ningún dato es demasiado pequeño o insignificante
- Nada se deriva si puede tener valor informativo para búsquedas o estadísticas
- El grafo es el núcleo — no una jerarquía
- Supabase es la única fuente de verdad
- El frontend solo transforma y visualiza — nunca infiere ni completa datos

---

## 📐 Reglas de código

### General
- No introducir cambios no solicitados
- No eliminar funcionalidad existente sin confirmación explícita
- No hardcodear valores visuales — usar variables CSS del portal
- No llamar a Supabase directamente desde componentes — solo desde `services/`
- No crear nodos del grafo fuera de `buildFamilyGraph.js`
- No reimplementar en el módulo lo que ya existe en `portal/`

### Archivos fuente de verdad
- `buildFamilyGraph.js` — única transformación válida del grafo
- `layoutFamilyGraph.js` — única fuente de posiciones visuales
- `relationshipTypes.js` — única fuente de tipos válidos de relación
- `geometry.js` — única fuente de constantes dimensionales
- `portal/design-system/` — única fuente de variables CSS

### Calidad
- Cada cambio debe ser mínimo, preciso y rastreable
- Si un cambio afecta múltiples archivos, listarlos todos antes de ejecutar
- Si hay ambigüedad en el requerimiento, preguntar antes de asumir
- Preferir soluciones simples sobre complejas cuando el resultado es equivalente

---

## 🗄️ Modelo de datos

### Tipos de relación válidos en `relationships.type`

**COUPLE_TYPES** (generan union nodes):
`married`, `partner`, `co_parent`, `separated`, `divorced`, `widowed`, `unknown`

**PARENT_TYPES** (establecen jerarquía generacional):
`father`, `mother`, `adoptive_father`, `adoptive_mother`, `stepfather`, `stepmother`, `foster_father`, `foster_mother`

**Fraternales:**
`brother`, `sister`

### Reglas del modelo
- COUPLE_TYPES: orden canónico `person_a_id < person_b_id` siempre
- PARENT_TYPES: `person_a_id` = progenitor, `person_b_id` = hijo
- Union nodes: derivados en runtime, nunca persistidos
- `child_of`: edge derivado cuando ambos padres están en COUPLE_TYPES

---

## 🎨 Design system

- Todos los valores visuales viven en `portal/design-system/` como variables CSS
- El módulo árbol nunca define colores, tipografía ni espaciado propios
- Las constantes dimensionales del grafo viven en `geometry.js`
- Al integrar al portal, las variables CSS del módulo se mapean a los tokens del portal

---

## ✅ PASO 2 — Al finalizar cada prompt

Después de ejecutar cualquier cambio, reportar obligatoriamente:

### Archivos modificados
Lista de todos los archivos tocados y qué cambió en cada uno.

### Actualizaciones propuestas para la documentación
Para cada uno de los 4 archivos indicar si requiere actualización:
- **DECISIONS.md** — ¿se tomó alguna decisión nueva?
- **ENGINE_RULES.md** — ¿cambió alguna regla del motor?
- **PROJECT_CONTEXT.md** — ¿cambió el estado funcional o el esquema de DB?
- **LEGADO_FUTURO.md** — ¿se resolvió algún pendiente o apareció deuda nueva?

### Efectos secundarios posibles
Advertir sobre cualquier parte del sistema que pueda verse afectada.

---

## ⚠️ Señales de alerta — detener y consultar antes de continuar

- El cambio contradice una decisión en `DECISIONS.md`
- El cambio viola una regla en `ENGINE_RULES.md`
- El cambio requiere modificar el esquema de Supabase
- El cambio afecta más de 3 archivos simultáneamente
- El cambio implementa en el módulo algo que debería estar en `portal/`
- Hay ambigüedad sobre qué comportamiento es el correcto
- El cambio podría romper datos existentes en la DB

---

## 📊 REGISTRO DE TOKENS — OBLIGATORIO en cada prompt

Al finalizar CADA prompt ejecutado, crear un archivo en `prompts/token_logs/` con el nombre `TOKEN_LOG_[nombre_del_prompt].md` usando esta estructura:

```markdown
# Token Log — [NOMBRE DEL PROMPT]
**Prompt:** [nombre del archivo]
**Fecha:** [fecha y hora]

## Desglose de tokens

| Fase | Descripción | Tokens |
|------|-------------|--------|
| Lectura de documentación | Archivos .md leídos | |
| Lectura de código fuente | Archivos .js/.jsx leídos | |
| Análisis / thinking | Diagnóstico y planificación | |
| Escritura de cambios | Ediciones ejecutadas | |
| Reporte final | Resumen post-ejecución | |
| **TOTAL** | | |

## Notas
- Qué fue lo más costoso:
- Archivos más grandes leídos:
- Observaciones:
```

Los números de tokens se toman de los contadores que Claude Code muestra en pantalla durante la ejecución. Si un valor no está disponible, anotar "n/d".
