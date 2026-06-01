# MyHeritage Clone

## 📌 Descripción

Aplicación web para construir árboles genealógicos complejos con soporte para múltiples tipos de relaciones familiares (biológicas, adoptivas y relaciones temporales entre personas).

Permite representar estructuras familiares reales usando un modelo basado en grafos.

---

## ⚙️ Stack tecnológico

- React
- Vite
- Tailwind CSS
- Supabase (PostgreSQL)

---

## 🧠 Objetivo

Construir un sistema de árbol genealógico avanzado tipo MyHeritage con visualización interactiva basada en grafos.

---

## 🧩 Modelo del sistema

El sistema se basa en un grafo genealógico:

- people → nodos (personas)
- relationships → edges (relaciones entre personas)
- union nodes → representación lógica de parejas/matrimonios

Supabase es la única fuente de verdad.
El frontend solo transforma y visualiza datos.

---

## 🗄️ Modelo de relaciones (actual)

Esquema real utilizado por el sistema:

- person_a_id
- person_b_id
- type
- since_year
- until_year

---

## 🚧 Estado actual

Sistema en desarrollo activo con backend en Supabase y frontend en React.

Funcional:
- CRUD de personas (`people`)
- Sistema de creación de relaciones entre personas basado en grafo
- Persistencia en Supabase

Pendiente:
- Visualización del árbol genealógico
- Motor de construcción del grafo familiar
- Layout de posicionamiento de nodos

---

## 📁 Estructura del proyecto
