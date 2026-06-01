# PROJECT_CONTEXT — Galicia Migrante / MyHeritage Clone

---

## ⚙️ Estado funcional actual

✔ React + Vite funcionando
✔ Supabase conectado
✔ CRUD completo de people (fetch, add, update, delete)
✔ CRUD completo de relationships (fetch, add, update, delete, dissolve)
✔ Graph engine implementado (buildFamilyGraph)
✔ Layout engine implementado (layoutFamilyGraph)
✔ GraphView renderiza nodes, edges y union nodes con SVG
✔ Nodos fantasma — muestra relaciones vacantes al hacer click en +
✔ Overlay oscuro en modo fantasma con botón cerrar
✔ Modal de persona (crear / editar / eliminar) con campos: nombre, apellidos, fecha, género, adoptado
✔ Modal de relación (crear / editar / eliminar) con prefill desde nodo fantasma
✔ Botón "Agregar persona" en barra de controles (persona sin vinculación)
✔ Búsqueda de personas por nombre (opacidad)
✔ Apellidos estructurados en tres campos: surname_1, surname_2, surname_married
✔ Cálculo automático de surnames en frontend (incluyendo "de Apellido" para casadas)
✔ Sugerencia automática de apellidos basada en surname_1 de cada progenitor
✔ Cónyuges nivelados a la misma generación en el layout
✔ Cónyuges sin ancestros posicionados al lado de su pareja en el layout
✔ Design system completo en index.css con variables CSS
✔ App.css sin estilos inline ni colores hardcodeados

---

## 🧠 Modelo mental del sistema

- `people` = nodos del grafo
- `relationships` = edges del grafo
- union nodes = nodos derivados en runtime, representan parejas (nunca se persisten)
- `adopted` = atributo de la persona, no de la relación
- `surnames` = calculado en frontend desde surname_1, surname_2, surname_married

---

## 🗄️ Esquema tabla people (actual)

| columna        | tipo        | notas                          |
|----------------|-------------|--------------------------------|
| id             | bigint      | PK                             |
| name           | text        | NOT NULL                       |
| surname_1      | text        | primer apellido                |
| surname_2      | text        | segundo apellido               |
| surname_married| text        | apellido de casada (opcional)  |
| surnames       | text        | calculado en frontend          |
| prefix         | text        | opcional                       |
| suffix         | text        | opcional                       |
| birth_day      | integer     | opcional                       |
| birth_month    | integer     | opcional                       |
| birth_year     | integer     | opcional                       |
| birth_place    | text        | opcional                       |
| gender         | text        |                                |
| adopted        | boolean     | default false                  |
| is_alive       | boolean     | default true                   |
| death_day      | integer     | opcional                       |
| death_month    | integer     | opcional                       |
| death_year     | integer     | opcional                       |
| death_place    | text        | opcional                       |
| death_cause    | text        | opcional                       |
| burial_place   | text        | opcional                       |
| created_at     | timestamptz |                                |

---

## 🚧 NO implementado aún

- Selector de otro progenitor al agregar hijo/hija: elegir persona existente o crear nueva (actualmente solo propone cónyuge actual)
- Bug de layout: hijos con un solo progenitor registrado quedan mal ordenados respecto a hermanos con ambos progenitores
- Pan & Zoom interactivo en el canvas SVG
- Filtro generacional real (el slider existe pero no filtra el grafo)
- Algoritmo de posicionamiento avanzado (Hourglass / Reingold-Tilford)
- Persona foco real (el árbol se centra en una persona específica)
- Validación de ciclos genealógicos
- Fotos de personas
- Autenticación de usuarios
- Registro de padres biológicos para personas adoptadas

---

## ⚠️ Regla de este archivo

Refleja SOLO el estado real actual del sistema.
No contiene ideas futuras, roadmap, ni propuestas no implementadas.
