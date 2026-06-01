# Legado Futuro — MyHeritage Clone

Intenciones de diseño que explican por qué el sistema está construido como un grafo, y hacia dónde puede evolucionar.

Este archivo NO describe trabajo pendiente ni decisiones activas.

---

## 🧠 El modelo es un grafo, no una jerarquía

El sistema está diseñado sobre:

- `people` → nodos base
- `relationships` → edges dirigidos

Esto permite representar estructuras familiares complejas que una jerarquía clásica no puede modelar:

- múltiples padres biológicos
- adopciones múltiples
- matrimonios sucesivos
- relaciones cruzadas entre ramas familiares

El grafo es la base conceptual del sistema.

---

## 🔗 Representación visual de familias (union nodes)

En visualización tipo árbol genealógico:

- un matrimonio se representa como un nodo intermedio (union node)
- los hijos se conectan a ese nodo, no directamente a los padres

Ejemplo conceptual:
