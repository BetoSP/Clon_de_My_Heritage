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

- CRUD de relaciones inaccesible desde la UI (modalRelacion nunca se abre)
- Línea co_parent aparece roja y llena en lugar de punteada violeta
- Pérdida de filiación visual cuando un hijo casado es "secundario" en su grupo (líneas diagonales cruzadas)
- Nodos fantasma con coordenadas negativas quedan parcialmente ocultos (overflow: hidden)
- El slider de generaciones no filtra sin foco activo

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

## 👤 Sistema de foco completo

- Doble click en nodo → activa foco → centra la vista → aparece en barra de contexto
- Badge `xN` → popup con lista de contextos donde aparece la persona → navegar
- Simbolito de link → navegar al subgrafo de esa persona
- Foco por defecto implementado — limpiar foco muestra árbol completo

---

## 🌳 Layout avanzado

- Algoritmo Reingold-Tilford completo para árboles complejos
- Manejo de ciclos genealógicos (primos que se casan)
- Vista hourglass centrada en una persona
- Filtro generacional real sin foco activo

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

---

## 📅 Precisión de fechas persistida

El selector de precisión ("Exactamente", "Antes de", "Después de", "Alrededor de") existe en la UI pero no se persiste. Requiere columnas `*_date_precision` en `people`.

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

Se ejecuta post-importación GEDCOM y bajo demanda.

---

## 🖼️ Fotos de personas

- Almacenamiento en Supabase Storage
- Múltiples fotos por persona con fecha y descripción
- Foto principal para mostrar en el nodo del árbol

---

## 🔗 Vinculación entre árboles

Una persona que existe en un árbol puede aparecer como referencia (🔗) en otro árbol distinto. Al integrar al portal:
- Una persona vive en su árbol natural
- En otros árboles aparece como referencia con icono 🔗
- Mecanismo manual: "buscar en otros árboles" al agregar pareja/familiar
- Smart Matching automático (tercera etapa del portal)

---

## ⚡ Performance a escala

- Índices en Supabase sobre `birth_year`, `birth_place`, `surname_1`, `type`
- React.memo para evitar re-renders del canvas SVG
- Carga lazy del grafo
- Web Workers para cálculo de layout en thread separado
- Virtualización para árboles masivos (solo nodos visibles en viewport)

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
