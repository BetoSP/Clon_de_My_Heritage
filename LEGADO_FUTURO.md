# Legado Futuro — Módulo Árbol Genealógico / Galicia Migrante

> Este archivo documenta deuda técnica conocida, funcionalidades pendientes e ideas para el futuro.
> NO describe decisiones activas — esas van en DECISIONS.md.

---

## 🎯 Objetivo del módulo

Construir el módulo genealógico más completo, eficiente y profesional posible — a la altura o por encima de MyHeritage, FamilySearch y Ancestry — listo para integrarse al ecosistema Galicia Migrante cuando alcance madurez.

---

## 🌐 Contexto del ecosistema

El árbol es el módulo estrella de Galicia Migrante, un ecosistema digital para preservar y transmitir la cultura gallega entre las comunidades de la diáspora. El ecosistema incluirá:

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
`modalRelacion` en `App.jsx` nunca se abre — `setModalRelacion` solo se llama con `null`. Diferido a la implementación del sidebar completo al estilo MyHeritage (ver [BUG-02]).

### [BUG-02] Edición de relaciones y disolución de pareja sin UI
`DissolveCell` en `GraphView.jsx` está definido pero nunca se renderiza (código muerto desde que se eliminó la tabla de relaciones). La edición/disolución de relaciones se implementará en el sidebar de persona — patrón MyHeritage: la relación se gestiona desde la pestaña "Relaciones" del sidebar de cualquiera de los dos cónyuges.

### [BUG-03] Pérdida de filiación visual — hijos casados como secundarios (líneas diagonales)
**Causa raíz:** cuando un hijo está casado y su cónyuge tiene ancestros en el árbol, ese hijo es marcado como `isSecondaryInGroup` en `layoutFamilyGraph.js`. Al quedar excluido de `getSortedChildren`, su posición X queda determinada por el layout de su cónyuge, no por el de sus padres. El edge `child_of` sigue existiendo y dibuja una línea diagonal.

**Ubicación:** `layoutFamilyGraph.js` → `getSortedChildren()` → `.filter((cid) => !isSecondaryInGroup.has(cid) ...)`

**Fix correcto:** refactorizar `placeSubtree` para que hijos casados-secundarios se posicionen considerando ambas restricciones (filiación + matrimonio). Afecta las funciones `calcSubtreeWidth`, `placeSubtree` y potencialmente la detección de `isSecondaryInGroup`. Alcance: 1–2 sesiones dedicadas.

**Fix alternativo (parche cosmético):** suprimir el edge `child_of` para nodos secundarios en el render — evita la diagonal a costa de no mostrar la conexión filiación. No recomendado.

### [BUG-04] Nodos fantasma con coordenadas negativas ocultos
Nodos fantasma con `dx` negativo quedan parcialmente ocultos si el nodo activo está cerca del borde izquierdo del canvas (overflow: hidden en el wrapper SVG).

### [BUG-05] Slider de generaciones no filtra sin foco activo
El slider de generaciones existe en la UI pero no tiene efecto cuando no hay foco activo — muestra siempre el árbol completo.

---

## 🎨 Mejoras visuales del nodo — pendientes

Basadas en especificación técnica de MyHeritage (Junio 2026). Simples de implementar, alto impacto visual.

### Barra de género en nodo
Franja vertical de 4px en el borde izquierdo del nodo, coloreada según género:
- Variable CSS `--node-gender-bar-male` (azul `#2b6cb0`)
- Variable CSS `--node-gender-bar-female` (rosa `#b83280`)
- Variable CSS `--node-gender-bar-unknown` (gris `#4a5568`)

Implementación: elemento SVG `rect` de 4px de ancho, altura completa del nodo, posición absoluta izquierda.

### Truncado de nombre con ellipsis
Si el nombre supera ~22 caracteres, truncar con `…`. En SVG usar `textLength` y `lengthAdjust` o calcular manualmente el ancho del texto.

### Símbolos genealógicos en fechas
Estándar genealógico universal — pendiente de implementar en GM:
- `* AAAA` — nacimiento
- `† AAAA` — fallecimiento
- `* AAAA — † AAAA` — si ambas fechas conocidas
- `* Desconocido` — si no hay fecha de nacimiento
- `* AAAA` solo — si está vivo

### Avatar con fallback diferenciado por género
En lugar de un avatar genérico único, usar siluetas diferenciadas:
- MALE → silueta azul-pizarra
- FEMALE → silueta rosa-pastel
- UNKNOWN → silueta gris neutra

Implementar como SVG inline o como 3 imágenes base64 en `geometry.js`.

### Bloqueo automático de género en modal por tipo de relación
Al seleccionar "Padre" → campo Género se bloquea en MALE automáticamente.
Al seleccionar "Madre" → campo Género se bloquea en FEMALE automáticamente.
Al seleccionar "Hijo", "Hija" o "Cónyuge" → campo Género queda libre.
Implementar en `AddRelativeModal.jsx` con lógica `onChange` en el selector de tipo de relación.

---

## 🔧 Mejoras de base de datos — pendientes

### Trigger de integridad genealógica en Supabase
Función PL/pgSQL que verifica antes de cada INSERT en `relationships`:
- Una persona no puede ser padre/madre de sí misma
- Una persona no puede ser su propio ancestro (detección de ciclos directos)

```sql
IF NEW.individual_id = parent_1 OR NEW.individual_id = parent_2 THEN
    RAISE EXCEPTION 'Un individuo no puede ser descendiente de sí mismo';
END IF;
```

### Auditoría de índices en Supabase
Revisar y agregar índices faltantes para performance a escala:
- `idx_relationships_person_a` sobre `person_a_id`
- `idx_relationships_person_b` sobre `person_b_id`
- `idx_relationships_type` sobre `type`
- `idx_people_surname_1` sobre `surname_1`
- `idx_people_birth_year` sobre `birth_year`
- `idx_people_birth_place` sobre `birth_place`

### birth_order en relaciones hijo
Agregar campo `birth_order INTEGER` a la tabla `relationships` para tipos parentales. Permite ordenar hijos explícitamente sin depender del año de nacimiento (útil cuando el año es desconocido).

### Migración del campo `adopted`
El campo `adopted` en `people` está obsoleto (ver DECISIONS [027]). Migrar a tipos de relación explícitos (`adoptive_father`, `adoptive_mother`) y eliminar el campo.

---

## 📊 Tabla derived_relationships

Para búsquedas eficientes a escala, implementar precálculo de relaciones derivadas:

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

Permite responder consultas como:
- "Buscame al tatarabuelo gallego de Fabián Gallo"
- "¿Dónde vivía la tía de la abuela de la cuñada de Lucía Montes?"

Sin navegar el grafo en tiempo real para cada búsqueda.

---

## 🖥️ Sidebar de persona (ProfileDrawer) — próximo bloque de trabajo

Implementar el panel lateral deslizable al estilo MyHeritage. Especificación completa en `myheritage.md` sección 45.

**Detonador:** click simple en zona neutra de la tarjeta de persona.

**CSS de animación:**
```css
position: fixed; right: 0; width: 380px; height: 100vh;
transition: transform 0.3s ease-in-out;
/* Cerrado: */ transform: translateX(100%);
/* Abierto: */ transform: translateX(0);
```

**Contenido:**
- Encabezado: foto 120x120px, nombre, edad, botones [Árbol] y [Editar]
- Datos biográficos con edición inline (click texto → input → blur/Enter → PATCH)
- Matrimonios con link clickeable al cónyuge
- Familia inmediata: padres, hermanos, cónyuge(s), hijos — cada uno navegable
- Eventos de vida cronológicos
- Fuentes y documentos vinculados

**Resuelve también:** BUG-01 y BUG-02 (edición y disolución de relaciones desde el sidebar).

---

## 👤 Sistema de foco completo

- Click en nodo → activa foco: centra vista + actualiza barra de contexto ✅ implementado
- Badge de vinculación → click → recarga subgrafo de esa persona ✅ implementado
- Badge `xN` → popup con lista de contextos → navegar (pendiente)
- Filtro generacional con foco activo (pendiente)

---

## 🌳 Layout avanzado

- Algoritmo Reingold-Tilford completo para árboles complejos
- Manejo de ciclos genealógicos (primos que se casan)
- Vista hourglass centrada en una persona
- Filtro generacional real sin foco activo
- BranchExtender: botón `+N` para expandir/colapsar ramas con animación fade-in

---

## 📥 GEDCOM import/export

- Importación GEDCOM 5.5/5.5.1 con pipeline tolerante a errores
- Exportación GEDCOM
- Importación/exportación CSV, Excel, JSON
- Plantilla descargable para importación manual

---

## 👤 Perfil extendido de persona

Campos adicionales para el perfil (segunda etapa del módulo):
- Evento de emigración/inmigración como campo destacado (barco, puerto, fecha, destino)
- Bautismo + padrinos + madrinas
- Servicio militar
- Múltiples ocupaciones con período
- Educación con institución y título
- Causa de fallecimiento estructurada

---

## 🗺️ Campos territoriales gallegos

- Parroquia + aldea + concello como campos estructurados
- Dropdown desde seed IGE (~3.800 parroquias)
- Reemplaza texto libre de lugar de nacimiento
- Puente entre el árbol y el módulo "Tu lugar en Galicia"
- **Identificación por lugar de origen:** opción de mostrar el lugar de origen como identificador complementario en el nodo. Ejemplo: "Manuel de Soutolongo". Activable/desactivable por configuración del árbol. Requiere campos territoriales gallegos implementados.

---

## 📅 Precisión de fechas persistida

El selector de precisión ("Exactamente", "Antes de", "Después de", "Alrededor de") existe en la UI pero no se persiste. Requiere columnas `*_date_precision` en `people`. Soportar también fechas aproximadas tipo "Circa 1930".

---

## 🔍 Búsqueda avanzada

- Full-text search sobre nombres, apellidos, lugares
- Búsqueda fuzzy para variantes ortográficas
- Búsqueda por características (ocupación, lugar, época)
- Navegación multi-salto usando `derived_relationships`

---

## ✅ Consistency Checker

Verificación lógica de:
- Fechas imposibles (nacimiento después de fallecimiento)
- Edades implausibles (madre a los 8 años)
- Relaciones circulares
- Datos críticos faltantes

Se ejecuta post-importación GEDCOM y bajo demanda. Panel de alertas en línea de tiempo.

---

## 🖼️ Fotos de personas

- Almacenamiento en Supabase Storage
- Múltiples fotos por persona con fecha y descripción
- Foto principal para mostrar en el nodo del árbol
- FaceTaggerOverlay: detección y etiquetado de rostros con coordenadas normalizadas
- Efecto cruzado bidireccional: hover sobre nombre → ilumina rostro en imagen

---

## 🤖 Pipeline de IA para fotos (tercera etapa)

Especificación completa en `myheritage.md` sección 47.

- **Mejorar nitidez** (GFPGAN): overlay con progreso → ImageSlider antes/después
- **Colorear** (DeOldify/DDColor): modal de selección versión → toggle Color/B&N permanente
- **Animar rostro** (Deep Nostalgia): selección de rostro → video HTML5 autoplay loop

Mientras hay un proceso IA activo, todos los botones de IA se bloquean simultáneamente.

---

## 🔗 Vinculación entre árboles

Una persona que existe en un árbol puede aparecer como referencia (🔗) en otro árbol distinto. Al integrar al portal:
- Una persona vive en su árbol natural
- En otros árboles aparece como referencia con badge de vinculación
- Mecanismo manual: "buscar en otros árboles" al agregar pareja/familiar
- Smart Matching automático (tercera etapa del portal)

---

## 🔍 Smart Matching (tercera etapa)

Fórmula de confidence scoring:
```
S_confianza = w1·S_nombre + w2·S_fecha_nacimiento + w3·S_coincidencia_padres
```
Umbral: 85%. Algoritmos fonéticos: Double Metaphone / Soundex adaptado al español.
NLP gallego: "Xoán Carballo de Boqueixón" ↔ "Juan Carballo de Boqueixón".

---

## 🏗️ Onboarding Wizard (segunda etapa)

Flujo de registro ligado a la creación del primer núcleo familiar:
1. Formulario simple sin contraseña inicial (nombre, apellido, género, email)
2. Captura de 4 abuelos con estado vital
3. POST `/api/v1/tree/initialize` → lanza Smart Matching → redirige al árbol

Especificación completa en `myheritage.md` sección 49.

---

## 💰 Paywall (segunda etapa)

Doble validación frontend + backend:
- Límite configurable de personas por plan (default 250 plan gratuito)
- Blur del árbol + modal de upgrade al alcanzar el límite
- Coincidencias visibles pero datos ofuscados desde backend para plan gratuito

Especificación completa en `myheritage.md` sección 50.

---

## ⚡ Performance a escala

- Índices en Supabase (ver sección "Mejoras de base de datos")
- React.memo para evitar re-renders del canvas SVG
- Carga lazy del grafo
- Web Workers para cálculo de layout en thread separado
- Virtualización para árboles masivos (solo nodos visibles en viewport)

---

## 📊 Registro de conteo de tokens por prompt

Sistema para registrar automáticamente el consumo de tokens de cada sesión de Claude Code. Opciones a evaluar:
- Leer el contador visible en la interfaz de Claude Code al finalizar cada prompt
- Consultar `console.anthropic.com` manualmente después de cada sesión
- Explorar si la API de Anthropic expone endpoint de usage consultable desde scripts

Objetivo: calcular el costo acumulado del proyecto por prompt y por sesión.

---

## 🔐 Autenticación (portal)

Cuando se integre al portal, el módulo hereda:
- Supabase Auth con roles
- Feature flags por plan
- Límite de personas por plan

El módulo árbol no implementa auth propio — recibe `user` y `plan` como props.

---

## 📦 Duplicación de personas

No hay solución implementada para detectar o fusionar personas duplicadas. Requiere:
- Algoritmo de similitud (nombre + apellidos + fecha + lugar)
- UI de confirmación y fusión
- Historial de fusiones para auditoría

---

## 🌐 Integración al ecosistema Galicia Migrante

**Condición para integrar:** árbol con CRUD completo, layout estable, GEDCOM, tipos parentales completos, perfil extendido, campos territoriales básicos.

**Al integrar:**
- El módulo pasa a `galicia-migrante/modulos/arbol/`
- Auth, design system, payments e i18n se mueven a `galicia-migrante/portal/`
- Los módulos futuros heredan lo que el árbol creó en `portal/`

**Módulos futuros del ecosistema:**
- Tu lugar en Galicia (territorio gallego navegable)
- Comunidad (asociaciones, micrositios)
- Cultura (biblioteca, memoria oral)
- Investigación (registros históricos, repositorio propio)
- Neo4j para redes migratorias (tercera etapa)
