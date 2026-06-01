// ══════════════════════════════════════════════════════════════════════════
// GEOMETRY.js — Fuente de verdad única para todas las constantes
//               dimensionales y funciones geométricas del árbol.
//
// ⚠️  ATENCIÓN: Este archivo controla TODO el layout dimensional del árbol.
//     Cualquier cambio aquí afecta GraphView y layoutFamilyGraph
//     simultáneamente.
//     Modificar SOLO con intención explícita y revisión cuidadosa.
//
// COLORES: viven en index.css como variables CSS (--node-*, --edge-*, etc.)
//
// RESPONSIVIDAD: pendiente. Cuando llegue el momento, agregar SCALE
//     y multiplicar todas las constantes dimensionales por él.
// ══════════════════════════════════════════════════════════════════════════

// ── Nodos persona ─────────────────────────────────────────────────────────
export const PERSON_W = 140; // ancho del nodo persona
export const PERSON_H = 80;  // alto del nodo persona
export const AVATAR_CX = 22;  // centro X del ícono dentro del nodo
export const AVATAR_CY = 38;  // centro Y del ícono dentro del nodo
export const AVATAR_R = 14;  // radio del ícono de persona
export const TEXT_X = 42;  // inicio X del texto dentro del nodo

// Geometría interna del nodo
export const NODE_RADIUS = 8;  // rx esquinas del nodo
export const NODE_ACCENT_X = 4;  // x de la barra lateral de acento
export const NODE_ACCENT_TOP = 10; // y inicio de la barra lateral
export const NODE_ACCENT_W = 4;  // strokeWidth de la barra lateral
export const NODE_SHADOW_DX = 2;  // desplazamiento X de la sombra
export const NODE_SHADOW_DY = 3;  // desplazamiento Y de la sombra

// Selección
export const NODE_SELECTION_PAD = 6;  // padding alrededor del nodo seleccionado
export const NODE_SELECTION_RADIUS = 14; // rx de la selección

// Botones dentro del nodo
export const NODE_BTN_EDIT_R = 9;  // radio botón ✏️
export const NODE_BTN_EDIT_CY = 14; // cy del botón ✏️ (desde top del nodo)
export const NODE_BTN_ADD_R = 10; // radio botón +
export const NODE_BTN_ADD_CY = 14; // distancia del + por debajo del nodo

// Truncado de nombre
export const NODE_NAME_MAX_CHARS = 19; // caracteres máximos antes de truncar

// ── Union node ────────────────────────────────────────────────────────────
export const UNION_R = 12; // radio lógico (usado en cálculos de posición)
export const UNION_DOT_R = 4;  // radio del punto visible. 0 = invisible

// ── Layout del árbol ──────────────────────────────────────────────────────
export const H_SPACING = 200; // espaciado horizontal entre nodos de misma generación
export const V_SPACING = 160; // espaciado vertical entre generaciones
export const CANVAS_PADDING = 120; // padding mínimo alrededor del árbol

// ── Líneas del árbol ──────────────────────────────────────────────────────
export const EDGE_RADIUS = 8;   // radio de los codos ortogonales
export const EDGE_STROKE_PARENT = 1.5; // grosor líneas parentales
export const EDGE_STROKE_SPOUSE = 2;   // grosor líneas de cónyuge

// ── Nodos fantasma ────────────────────────────────────────────────────────
export const GHOST_W = 170; // ancho del nodo fantasma
export const GHOST_H = 56;  // alto del nodo fantasma
export const GHOST_GAP_H = 40;  // distancia horizontal desde borde del nodo activo
export const GHOST_GAP_V = 50;  // distancia vertical desde borde del nodo activo
export const GHOST_RADIUS = 10;  // rx esquinas del nodo fantasma
export const GHOST_AVATAR_CX = 28;  // centro X del ícono dentro del fantasma
export const GHOST_STROKE_W = 1.5; // grosor borde del nodo fantasma
export const GHOST_TEXT_X = 54;  // inicio X del texto dentro del fantasma
export const GHOST_SHADOW_DX = 2;   // desplazamiento X sombra del fantasma
export const GHOST_SHADOW_DY = 3;   // desplazamiento Y sombra del fantasma
export const GHOST_LINE_W = 1;   // grosor líneas fantasma
export const GHOST_LINE_OPACITY = 0.9; // opacidad líneas fantasma

// ── Offsets de cada slot fantasma ─────────────────────────────────────────
export function getSlotOffset(position) {
    const nodeCX = PERSON_W / 2;

    switch (position) {
        case "top-left":
            return {
                dx: nodeCX - GHOST_W - GHOST_GAP_H / 2,
                dy: -(GHOST_H + GHOST_GAP_V),
            };
        case "top-right":
            return {
                dx: nodeCX + GHOST_GAP_H / 2,
                dy: -(GHOST_H + GHOST_GAP_V),
            };
        case "right":
            return {
                dx: PERSON_W + GHOST_GAP_H,
                dy: PERSON_H / 2 - GHOST_H / 2,
            };
        case "bottom-left":
            return {
                dx: nodeCX - GHOST_W - GHOST_GAP_H / 2,
                dy: PERSON_H + GHOST_GAP_V,
            };
        case "bottom-right":
            return {
                dx: nodeCX + GHOST_GAP_H / 2,
                dy: PERSON_H + GHOST_GAP_V,
            };
        case "left-top":
            return {
                dx: -(GHOST_W + GHOST_GAP_H),
                dy: -(GHOST_H / 2 + 5),
            };
        case "left-bot":
            return {
                dx: -(GHOST_W + GHOST_GAP_H),
                dy: PERSON_H / 2,
            };
        default:
            return { dx: 0, dy: 0 };
    }
}

// ── Línea ortogonal con radio en codos ────────────────────────────────────
export function elbowPath(x1, y1, x2, y2, r = EDGE_RADIUS) {
    const midY = y1 + (y2 - y1) / 2;
    const dx = x2 - x1;
    const sign = dx >= 0 ? 1 : -1;
    const sr = Math.min(r, Math.abs(dx) / 2, Math.abs(midY - y1) / 2, Math.abs(y2 - midY) / 2);

    if (sr < 1 || Math.abs(dx) < 2) {
        return `M ${x1},${y1} L ${x1},${midY} L ${x2},${midY} L ${x2},${y2}`;
    }
    return [
        `M ${x1},${y1}`,
        `L ${x1},${midY - sr}`,
        `Q ${x1},${midY} ${x1 + sign * sr},${midY}`,
        `L ${x2 - sign * sr},${midY}`,
        `Q ${x2},${midY} ${x2},${midY + sr}`,
        `L ${x2},${y2}`,
    ].join(" ");
}

// ── Líneas desde borde del nodo activo al borde del nodo fantasma ─────────
//
// top/bottom: salen del centro superior/inferior del nodo activo,
//             bajan/suben verticalmente hasta la mitad del gap,
//             luego van horizontal al centro del fantasma.
//
// right: sale del borde derecho, va horizontal directo al fantasma.
//
// left (hermanos): sale del borde izquierdo del nodo activo,
//                  va horizontal hasta un punto medio,
//                  luego sube/baja verticalmente al centro del fantasma.
//                  Forma un tridente compartido entre hermano y hermana.

export function ghostLinePath(an, gx, gy, position) {
    const cx = an.x + PERSON_W / 2;
    const cy = an.y + PERSON_H / 2;
    const midX = an.x - GHOST_GAP_H / 2; // punto medio del tridente (hermanos)

    switch (position) {
        case "top-left":
        case "top-right": {
            const ex = gx + GHOST_W / 2;
            const ey = gy + GHOST_H;
            const midY = an.y - GHOST_GAP_V / 2;
            return `M ${cx},${an.y} L ${cx},${midY} L ${ex},${midY} L ${ex},${ey}`;
        }
        case "bottom-left":
        case "bottom-right": {
            const ex = gx + GHOST_W / 2;
            const ey = gy;
            const midY = an.y + PERSON_H + GHOST_GAP_V / 2;
            return `M ${cx},${an.y + PERSON_H} L ${cx},${midY} L ${ex},${midY} L ${ex},${ey}`;
        }
        case "right": {
            const ex = gx;
            const ey = gy + GHOST_H / 2;
            return `M ${an.x + PERSON_W},${cy} L ${ex},${cy} L ${ex},${ey}`;
        }
        case "left-top": {
            const ex = gx + GHOST_W;
            const ey = gy + GHOST_H / 2;
            return `M ${an.x},${cy} L ${midX},${cy} L ${midX},${ey} L ${ex},${ey}`;
        }
        case "left-bot": {
            const ex = gx + GHOST_W;
            const ey = gy + GHOST_H / 2;
            return `M ${an.x},${cy} L ${midX},${cy} L ${midX},${ey} L ${ex},${ey}`;
        }
        default:
            return `M ${cx},${cy} L ${gx + GHOST_W / 2},${gy + GHOST_H / 2}`;
    }
}