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
export const PERSON_W = 140;
export const PERSON_H = 80;
export const AVATAR_CX = 22;
export const AVATAR_CY = 38;
export const AVATAR_R = 14;
export const TEXT_X = 42;

// Geometría interna del nodo
export const NODE_RADIUS = 8;
export const NODE_ACCENT_X = 4;
export const NODE_ACCENT_TOP = 10;
export const NODE_ACCENT_W = 4;
export const NODE_SHADOW_DX = 2;
export const NODE_SHADOW_DY = 3;

// Selección
export const NODE_SELECTION_PAD = 6;
export const NODE_SELECTION_RADIUS = 14;

// Botones dentro del nodo
export const NODE_BTN_EDIT_R = 9;
export const NODE_BTN_EDIT_CY = 14;
export const NODE_BTN_ADD_R = 10;
export const NODE_BTN_ADD_CY = 14;

// Truncado de nombre
export const NODE_NAME_MAX_CHARS = 19;

// ── Íconos de nodo ────────────────────────────────────────────────────────
// Tamaños — modificar para escalar íconos en todos los nodos simultáneamente
export const NODE_ICON_SIZE = 14;        // tamaño base de todos los íconos SVG
export const NODE_ICON_EDIT_R = 9;       // radio del círculo del lápiz
export const NODE_ICON_LINK_R = 10;      // radio del círculo del link externo
export const NODE_BADGE_R = 10;          // radio del badge xN
export const NODE_BADGE_FONT = 9;        // fontSize del texto del badge

// Posiciones relativas al nodo
export const NODE_ICON_EDIT_CX = PERSON_W - 12;  // lápiz: x desde origen del nodo
export const NODE_ICON_EDIT_CY = PERSON_H - 12;  // lápiz: y desde origen del nodo
export const NODE_ICON_LINK_DX = PERSON_W + 10;  // link: x fuera del nodo (derecha)
export const NODE_ICON_LINK_DY = 0;              // link: y desde top del nodo
export const NODE_BADGE_DX = 0;                  // badge: x desde origen (esquina izq)
export const NODE_BADGE_DY = 0;                  // badge: y desde top del nodo

// ── Union node ────────────────────────────────────────────────────────────
export const UNION_R = 12;
export const UNION_DOT_R = 4;

// ── Layout del árbol ──────────────────────────────────────────────────────
export const H_SPACING = 200;
export const V_SPACING = 160;
export const CANVAS_PADDING = 120;

// ── Líneas del árbol ──────────────────────────────────────────────────────
export const EDGE_RADIUS = 8;
export const EDGE_STROKE_PARENT = 1.5;
export const EDGE_STROKE_SPOUSE = 2;

// ── Nodos fantasma ────────────────────────────────────────────────────────
export const GHOST_W = 170;
export const GHOST_H = 56;
export const GHOST_GAP_H = 40;
export const GHOST_GAP_V = 50;
export const GHOST_RADIUS = 10;
export const GHOST_AVATAR_CX = 28;
export const GHOST_STROKE_W = 1.5;
export const GHOST_TEXT_X = 54;
export const GHOST_SHADOW_DX = 2;
export const GHOST_SHADOW_DY = 3;
export const GHOST_LINE_W = 1;
export const GHOST_LINE_OPACITY = 0.9;

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
export function ghostLinePath(an, gx, gy, position) {
    const cx = an.x + PERSON_W / 2;
    const cy = an.y + PERSON_H / 2;
    const midX = an.x - GHOST_GAP_H / 2;

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