import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import { layoutFamilyGraph } from "../graph/layoutFamilyGraph.js";
import { COUPLE_TYPES, PARENT_TYPES } from "../graph/relationshipTypes.js";
import {
  PERSON_W, PERSON_H,
  AVATAR_CX, AVATAR_CY, AVATAR_R, TEXT_X,
  NODE_RADIUS, NODE_GENDER_BAR_W,
  NODE_SHADOW_DX, NODE_SHADOW_DY,
  NODE_SELECTION_PAD, NODE_SELECTION_RADIUS,
  NODE_BTN_ADD_R, NODE_BTN_ADD_CY,
  NODE_NAME_MAX_CHARS,
  NODE_ICON_SIZE, NODE_ICON_EDIT_R, NODE_ICON_LINK_R, NODE_BADGE_R, NODE_BADGE_FONT,
  NODE_ICON_EDIT_CX, NODE_ICON_EDIT_CY, NODE_ICON_LINK_DX, NODE_ICON_LINK_DY,
  NODE_BADGE_DX, NODE_BADGE_DY,
  NODE_STROKE_NORMAL, NODE_STROKE_THIN, NODE_BADGE_TEXT_DY,
  GHOST_AVATAR_R, GHOST_AVATAR_HEAD_R, GHOST_AVATAR_HEAD_DY,
  GHOST_AVATAR_BODY_RX, GHOST_AVATAR_BODY_RY, GHOST_AVATAR_BODY_DY, GHOST_TEXT_DY,
  GRID_CELL_SIZE, GRID_STROKE_W,
  CANVAS_FALLBACK_W, CANVAS_FALLBACK_H,
  EDGE_OPACITY_NORMAL, EDGE_OPACITY_GHOST,
  NODE_OPACITY_UNFOCUSED, NODE_OPACITY_UNMATCHED,
  UNION_R, UNION_DOT_R, UNION_EDGE_DY,
  EDGE_RADIUS,
  CANVAS_PADDING,
  EDGE_STROKE_PARENT, EDGE_STROKE_SPOUSE,
  GHOST_W, GHOST_H,
  GHOST_RADIUS, GHOST_AVATAR_CX, GHOST_STROKE_W,
  GHOST_TEXT_X, GHOST_SHADOW_DX, GHOST_SHADOW_DY,
  GHOST_LINE_W, GHOST_LINE_OPACITY,
  elbowPath, ghostLinePath, getSlotOffset,
} from "../graph/geometry.js";

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.001;

function edgePath(src, tgt) {
  const isSrcUnion = src.type === "union";
  const isTgtUnion = tgt.type === "union";
  const srcCX = src.x + (isSrcUnion ? UNION_R : PERSON_W / 2);
  const srcCY = src.y + (isSrcUnion ? UNION_R : PERSON_H / 2);
  const srcBotY = src.y + (isSrcUnion ? UNION_R * 2 : PERSON_H);
  const tgtCX = tgt.x + (isTgtUnion ? UNION_R : PERSON_W / 2);
  const tgtTopY = tgt.y + (isTgtUnion ? UNION_R : 0);
  if (!isSrcUnion && isTgtUnion) {
    return `M ${srcCX},${srcCY} L ${tgt.x + UNION_R},${tgt.y + UNION_R}`;
  }
  if (isSrcUnion && !isTgtUnion) {
    const midY = (src.y + UNION_EDGE_DY + tgt.y) / 2;
    return elbowPath(srcCX, srcBotY, tgtCX, tgtTopY, EDGE_RADIUS, midY);
  }
  return elbowPath(srcCX, srcBotY, tgtCX, tgtTopY);
}

function PersonAvatar({ cx, cy, r }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="var(--avatar-bg)" />
      <circle cx={cx} cy={cy - r * 0.35} r={r * 0.38} fill="var(--avatar-fill)" />
      <ellipse cx={cx} cy={cy + r * 0.6} rx={r * 0.68} ry={r * 0.48} fill="var(--avatar-fill)" />
    </g>
  );
}

function getVacantSlots(nodeId, edges, nodes) {
  const hasFather = edges.some((e) => e.target === nodeId && PARENT_TYPES.has(e.type) && e.type.includes("father"));
  const hasMother = edges.some((e) => e.target === nodeId && PARENT_TYPES.has(e.type) && e.type.includes("mother"));
  const hasSpouse = edges.some((e) =>
    COUPLE_TYPES.has(e.type) && (
      e.source === nodeId ||
      nodes.filter((n) => n.type === "union").some((u) =>
        u.id === e.target &&
        (u.data.person_a_id === nodeId || u.data.person_b_id === nodeId)
      )
    )
  );

  const slots = [];
  if (!hasFather) slots.push({ type: "father", label: "Agregar padre", position: "top-left" });
  if (!hasMother) slots.push({ type: "mother", label: "Agregar madre", position: "top-right" });
  if (!hasSpouse) slots.push({ type: "spouse", label: "Agregar cónyuge", position: "right" });
  if (hasSpouse) slots.push({ type: "spouse_another", label: "Agregar otra pareja", position: "right" });
  slots.push({ type: "son", label: "Agregar hijo", position: "bottom-left" });
  slots.push({ type: "daughter", label: "Agregar hija", position: "bottom-right" });
  slots.push({ type: "brother", label: "Agregar hermano", position: "left-top" });
  slots.push({ type: "sister", label: "Agregar hermana", position: "left-bot" });
  return slots;
}

function GhostNode({ x, y, label, isFemale, onClick }) {
  const borderColor = isFemale ? "var(--edge-color-spouse)" : "var(--edge-color-parent)";
  return (
    <g onClick={onClick} style={{ cursor: "pointer" }}>
      <rect x={x + GHOST_SHADOW_DX} y={y + GHOST_SHADOW_DY} width={GHOST_W} height={GHOST_H} rx={GHOST_RADIUS} fill="var(--ghost-node-shadow)" />
      <rect x={x} y={y} width={GHOST_W} height={GHOST_H} rx={GHOST_RADIUS} fill="var(--ghost-node-bg)" stroke={borderColor} strokeWidth={GHOST_STROKE_W} />
      <circle cx={x + GHOST_AVATAR_CX} cy={y + GHOST_H / 2} r={GHOST_AVATAR_R} fill="var(--ghost-avatar-bg)" />
      <circle cx={x + GHOST_AVATAR_CX} cy={y + GHOST_H / 2 - GHOST_AVATAR_HEAD_DY} r={GHOST_AVATAR_HEAD_R} fill="var(--ghost-avatar-fill)" />
      <ellipse cx={x + GHOST_AVATAR_CX} cy={y + GHOST_H / 2 + GHOST_AVATAR_BODY_DY} rx={GHOST_AVATAR_BODY_RX} ry={GHOST_AVATAR_BODY_RY} fill="var(--ghost-avatar-fill)" />
      <text x={x + GHOST_TEXT_X} y={y + GHOST_H / 2 + GHOST_TEXT_DY} fontSize="var(--ghost-node-font)" fill="var(--ghost-node-text)" style={{ fontFamily: "var(--font-family-node)", fontWeight: "var(--font-weight-semibold)" }}>
        {label}
      </text>
    </g>
  );
}

function PersonNode({ node, isSelected, isFocus, isGhostActive, unionCount, onSelect, onAddRelative, onEditPerson, onFocusPerson }) {
  const { x, y } = node;
  const isMale = node.data.gender === "male";
  const isFemale = node.data.gender === "female";

  const accentColor = isFocus ? "var(--node-focus-accent)" : isMale ? "var(--node-male-accent)" : "var(--node-female-accent)";
  const bgColor = isGhostActive ? "var(--node-active-bg)" : isFocus ? "var(--node-focus-bg)" : isMale ? "var(--node-male-bg)" : "var(--node-female-bg)";
  const borderColor = isGhostActive ? (isMale ? "var(--node-active-border-male)" : "var(--node-active-border-female)") : isFocus ? "var(--node-focus-border)" : isMale ? "var(--node-male-border)" : "var(--node-female-border)";
  const genderBarColor = isMale ? "var(--node-gender-bar-male)" : isFemale ? "var(--node-gender-bar-female)" : "var(--node-gender-bar-unknown)";

  const name = node.data.displayName ?? (node.data.name ?? "—");
  const surnames = node.data.displaySurnames ?? null;
  const dates = node.data.dateDisplay ?? null;

  const badgeCX = x + NODE_BADGE_DX;
  const badgeCY = y + NODE_BADGE_DY;
  const linkCX = x + NODE_ICON_LINK_DX;
  const linkCY = y + NODE_ICON_LINK_DY;
  const editCX = x + NODE_ICON_EDIT_CX;
  const editCY = y + NODE_ICON_EDIT_CY;

  return (
    <g style={{ cursor: "pointer" }} onClick={() => onSelect(node.id)}>
      {isSelected && !isGhostActive && (
        <rect x={x - NODE_SELECTION_PAD} y={y - NODE_SELECTION_PAD} width={PERSON_W + NODE_SELECTION_PAD * 2} height={PERSON_H + NODE_SELECTION_PAD * 2} rx={NODE_SELECTION_RADIUS} fill="var(--node-selection-bg)" stroke="var(--node-selection-border)" strokeWidth={NODE_STROKE_THIN} strokeDasharray="var(--node-selection-dash)" />
      )}
      <rect x={x + NODE_SHADOW_DX} y={y + NODE_SHADOW_DY} width={PERSON_W} height={PERSON_H} rx={NODE_RADIUS} fill="var(--node-shadow-color)" />
      <rect x={x} y={y} width={PERSON_W} height={PERSON_H} rx={NODE_RADIUS} fill={bgColor} stroke={borderColor} style={{ strokeWidth: (isGhostActive || isFocus) ? "var(--node-active-stroke-w)" : NODE_STROKE_NORMAL }} />
      <line x1={x + NODE_GENDER_BAR_W / 2} y1={y + NODE_RADIUS} x2={x + NODE_GENDER_BAR_W / 2} y2={y + PERSON_H - NODE_RADIUS} stroke={genderBarColor} strokeWidth={NODE_GENDER_BAR_W} strokeLinecap="butt" />
      <PersonAvatar cx={x + AVATAR_CX} cy={y + AVATAR_CY} r={AVATAR_R} />
      <text x={x + TEXT_X} y={y + 20} fontSize="var(--node-font-name)" fontWeight="700" fill="var(--node-text-name)" style={{ fontFamily: "var(--font-family-node)" }}>{name}</text>
      {surnames && <text x={x + TEXT_X} y={y + 33} fontSize="var(--node-font-name)" fontWeight="700" fill="var(--node-text-name)" style={{ fontFamily: "var(--font-family-node)" }}>{surnames}</text>}
      {dates && <text x={x + TEXT_X} y={y + 46} fontSize="var(--node-font-date)" fill="var(--node-text-date)" style={{ fontFamily: "var(--font-family-node)" }}>{dates}</text>}

      {unionCount > 1 && (
        <g>
          <circle cx={badgeCX} cy={badgeCY} r={NODE_BADGE_R} fill="var(--icon-badge-bg)" />
          <text x={badgeCX} y={badgeCY + NODE_BADGE_TEXT_DY} textAnchor="middle" fontSize={NODE_BADGE_FONT} fill="var(--icon-badge-text)" style={{ fontFamily: "var(--font-family-node)", fontWeight: "var(--font-weight-bold)" }}>x{unionCount}</text>
        </g>
      )}

      {!isGhostActive && (node.data.hasHiddenParents || unionCount > 1) && !isFocus && (
        <g onClick={(e) => { e.stopPropagation(); onFocusPerson(node.id); }} style={{ cursor: "pointer" }}>
          <circle cx={linkCX} cy={linkCY} r={NODE_ICON_LINK_R} fill="var(--icon-link-bg)" stroke={accentColor} strokeWidth={NODE_STROKE_NORMAL} />
          <use href="/icons.svg#icon-link-tree" x={linkCX - NODE_ICON_SIZE / 2} y={linkCY - NODE_ICON_SIZE / 2} width={NODE_ICON_SIZE} height={NODE_ICON_SIZE} stroke={accentColor} color={accentColor} />
        </g>
      )}

      {!isGhostActive && (
        <g onClick={(e) => { e.stopPropagation(); onEditPerson(node.id); }} style={{ cursor: "pointer" }}>
          <circle cx={editCX} cy={editCY} r={NODE_ICON_EDIT_R} fill="var(--icon-edit-bg)" stroke={accentColor} strokeWidth={NODE_STROKE_THIN} style={{ opacity: "var(--node-icon-edit-opacity)" }} />
          <use href="/icons.svg#icon-edit" x={editCX - NODE_ICON_SIZE / 2} y={editCY - NODE_ICON_SIZE / 2} width={NODE_ICON_SIZE} height={NODE_ICON_SIZE} stroke={accentColor} color={accentColor} />
        </g>
      )}

      <g onClick={(e) => { e.stopPropagation(); onAddRelative(node.id); }} style={{ cursor: "pointer" }}>
        <circle cx={x + PERSON_W / 2} cy={y + PERSON_H + NODE_BTN_ADD_CY} r={NODE_BTN_ADD_R} fill="var(--node-btn-add-bg)" stroke={accentColor} strokeWidth={NODE_STROKE_NORMAL} style={{ opacity: "var(--node-btn-add-opacity)" }} />
        <use href="/icons.svg#icon-add" x={x + PERSON_W / 2 - NODE_ICON_SIZE / 2} y={y + PERSON_H + NODE_BTN_ADD_CY - NODE_ICON_SIZE / 2} width={NODE_ICON_SIZE} height={NODE_ICON_SIZE} stroke={accentColor} color={accentColor} />
      </g>
    </g>
  );
}

function DissolveCell({ edge, dissolvingRelId, dissolveYear, setDissolvingRelId, setDissolveYear, onDissolveSpouse, spouseRelId }) {
  const relId = spouseRelId(edge.id);
  const isDissolving = dissolvingRelId === relId;

  if (isDissolving) {
    return (
      <span className="dissolve-wrap">
        <input type="number" value={dissolveYear} onChange={(e) => setDissolveYear(e.target.value)} placeholder="Año" className="dissolve-year-input" />
        <button onClick={() => { if (!dissolveYear) return; onDissolveSpouse?.(relId, Number(dissolveYear)); setDissolvingRelId(null); setDissolveYear(""); }} className="btn-dissolve-confirm">✓</button>
        <button onClick={() => { setDissolvingRelId(null); setDissolveYear(""); }} className="btn-dissolve-cancel">✕</button>
      </span>
    );
  }

  return (
    <button onClick={() => setDissolvingRelId(relId)} className="btn-dissolve-trigger">activo · disolver</button>
  );
}

export default function GraphView({
  graph,
  onDissolveSpouse,
  focusNodeId = null,
  selectedNodeId = null,
  onSelectNode = null,
  onAddRelative = null,
  onEditPerson = null,
  onDeletePerson = null,
  onFocusPerson = null,
  searchQuery = "",
}) {
  const layout = useMemo(() => layoutFamilyGraph(graph), [graph]);
  const nodeMap = useMemo(() => new Map(layout.nodes.map((n) => [n.id, n])), [layout.nodes]);

  const [dissolvingRelId, setDissolvingRelId] = useState(null);
  const [dissolveYear, setDissolveYear] = useState("");
  const [activeGhostNodeId, setActiveGhostNodeId] = useState(null);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef(null);
  const panOrigin = useRef({ x: 0, y: 0 });
  const wrapperRef = useRef(null);
  const didPan = useRef(false);

  const canvasW = layout.nodes.length
    ? Math.max(...layout.nodes.map((n) => n.x + (n.type === "union" ? UNION_R * 2 : PERSON_W))) + CANVAS_PADDING * 2 + GHOST_W + CANVAS_PADDING
    : CANVAS_FALLBACK_W;

  const canvasH = layout.nodes.length
    ? Math.max(...layout.nodes.map((n) => n.y + (n.type === "union" ? UNION_R * 2 : PERSON_H))) + CANVAS_PADDING * 2 + GHOST_H + CANVAS_PADDING
    : CANVAS_FALLBACK_H;

  useEffect(() => {
    if (!wrapperRef.current || layout.nodes.length === 0) return;
    const wrapper = wrapperRef.current;
    const wW = wrapper.clientWidth;
    const wH = wrapper.clientHeight;

    if (focusNodeId) {
      const focusNode = layout.nodes.find((n) => n.id === String(focusNodeId));
      if (focusNode) {
        const nodeCX = CANVAS_PADDING + focusNode.x + PERSON_W / 2;
        const nodeCY = CANVAS_PADDING + focusNode.y + PERSON_H / 2;
        setPan({ x: wW / 2 - nodeCX * zoom, y: wH / 2 - nodeCY * zoom });
        return;
      }
    }

    setPan({ x: (wW - canvasW * zoom) / 2, y: (wH - canvasH * zoom) / 2 });
  }, [focusNodeId, layout.nodes.length, canvasW, canvasH]);

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    if (activeGhostNodeId) return;
    setIsPanning(true);
    didPan.current = false;
    panStart.current = { x: e.clientX, y: e.clientY };
    panOrigin.current = { ...pan };
    e.preventDefault();
  }, [pan, activeGhostNodeId]);

  const handleMouseMove = useCallback((e) => {
    if (!isPanning || !panStart.current) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didPan.current = true;
    setPan({ x: panOrigin.current.x + dx, y: panOrigin.current.y + dy });
  }, [isPanning]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    panStart.current = null;
  }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setZoom((prevZoom) => {
      const delta = -e.deltaY * ZOOM_STEP;
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prevZoom + delta * prevZoom));
      const scale = newZoom / prevZoom;
      setPan((prevPan) => ({
        x: mouseX - scale * (mouseX - prevPan.x),
        y: mouseY - scale * (mouseY - prevPan.y),
      }));
      return newZoom;
    });
  }, []);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    wrapper.addEventListener("wheel", handleWheel, { passive: false });
    return () => wrapper.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  function spouseRelId(edgeId) {
    return parseInt(edgeId.split("-")[1], 10);
  }

  function nodeOpacity(node) {
    if (activeGhostNodeId) return node.id === activeGhostNodeId ? 1 : NODE_OPACITY_UNFOCUSED;
    if (!searchQuery) return 1;
    const name = (node.data?.name ?? "").toLowerCase();
    return name.includes(searchQuery.toLowerCase()) ? 1 : NODE_OPACITY_UNMATCHED;
  }

  function handleAddRelative(nodeId) {
    setActiveGhostNodeId((prev) => prev === nodeId ? null : nodeId);
  }

  function handleGhostClick(nodeId, slotType) {
    setActiveGhostNodeId(null);
    onAddRelative?.(nodeId, slotType);
  }

  function handleCanvasClick() {
    if (didPan.current) { didPan.current = false; return; }
  }

  // ── Calcular unionCount por persona ───────────────────────────────────────
  const personUnionCount = useMemo(() => {
    const count = new Map();
    for (const node of layout.nodes) {
      if (node.type !== "union") continue;
      for (const pid of [node.data.person_a_id, node.data.person_b_id]) {
        count.set(pid, (count.get(pid) ?? 0) + 1);
      }
    }
    return count;
  }, [layout.nodes]);

  function handleNodeSelect(nodeId) {
    const clickedNode = nodeMap.get(nodeId);
    if (clickedNode && wrapperRef.current) {
      const wrapper = wrapperRef.current;
      const nodeCX = CANVAS_PADDING + clickedNode.x + PERSON_W / 2;
      const nodeCY = CANVAS_PADDING + clickedNode.y + PERSON_H / 2;
      setPan({ x: wrapper.clientWidth / 2 - nodeCX * zoom, y: wrapper.clientHeight / 2 - nodeCY * zoom });
    }
    onSelectNode?.(nodeId);
  }

  const activeNode = activeGhostNodeId ? nodeMap.get(activeGhostNodeId) : null;
  const ghostSlots = activeNode ? getVacantSlots(activeGhostNodeId, layout.edges, layout.nodes) : [];
  const cursor = activeGhostNodeId ? "default" : isPanning ? "grabbing" : "grab";

  return (
    <div className="graph-col">
      <div
        className="canvas-wrapper canvas-wrapper--relative"
        ref={wrapperRef}
        style={{ overflow: "hidden", cursor }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
      >
        {layout.nodes.length === 0 ? (
          <div className="canvas-empty">
            <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={1.5} className="canvas-empty__icon">
              <circle cx={24} cy={16} r={8} />
              <path d="M8 40c0-8.837 7.163-16 16-16s16 7.163 16 16" />
            </svg>
            <p className="canvas-empty__text">Sin datos. Usá "Agregar persona" para comenzar.</p>
          </div>
        ) : (
          <>
            <div style={{
              position: "absolute",
              top: 0, left: 0,
              transformOrigin: "0 0",
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              willChange: "transform",
            }}>
              <svg width={canvasW} height={canvasH} style={{ display: "block" }} overflow="visible">
                <defs>
                  <pattern id="grid" width={GRID_CELL_SIZE} height={GRID_CELL_SIZE} patternUnits="userSpaceOnUse">
                    <path d={`M ${GRID_CELL_SIZE} 0 L 0 0 0 ${GRID_CELL_SIZE}`} fill="none" stroke="var(--color-border-light)" strokeWidth={GRID_STROKE_W} />
                  </pattern>
                </defs>
                <rect width={canvasW} height={canvasH} fill="url(#grid)" />

                <g transform={`translate(${CANVAS_PADDING}, ${CANVAS_PADDING})`}>
                  {layout.edges.map((edge) => {
                    const src = nodeMap.get(edge.source);
                    const tgt = nodeMap.get(edge.target);
                    if (!src || !tgt) return null;
                    const d = edgePath(src, tgt);
                    const isCouple = COUPLE_TYPES.has(edge.type);
                    const isCoParent = edge.type === "co_parent";
                    const isDissolved = ["separated", "divorced", "widowed"].includes(edge.type) || edge.until_year !== null;
                    const edgeStroke = isCoParent
                      ? "var(--edge-color-co-parent)"
                      : isDissolved
                        ? "var(--edge-color-dissolved)"
                        : isCouple
                          ? "var(--edge-color-spouse)"
                          : "var(--edge-color-parent)";
                    const edgeDash = isCoParent ? "var(--edge-dash-co-parent)" : isDissolved ? "var(--edge-dash-dissolved)" : undefined;
                    return (
                      <path key={edge.id} d={d} fill="none"
                        stroke={edgeStroke}
                        strokeWidth={isCouple ? EDGE_STROKE_SPOUSE : EDGE_STROKE_PARENT}
                        strokeDasharray={edgeDash}
                        strokeLinecap="round" strokeLinejoin="round"
                        strokeOpacity={activeGhostNodeId ? EDGE_OPACITY_GHOST : EDGE_OPACITY_NORMAL}
                      />
                    );
                  })}

                  {layout.nodes.filter((n) => n.type === "person").map((node) => (
                    <g key={node.id} opacity={nodeOpacity(node)}>
                      <PersonNode
                        node={node}
                        isSelected={selectedNodeId === node.id}
                        isFocus={focusNodeId === node.id}
                        isGhostActive={activeGhostNodeId === node.id}
                        unionCount={personUnionCount.get(node.id) ?? 0}
                        onSelect={handleNodeSelect}
                        onAddRelative={handleAddRelative}
                        onEditPerson={onEditPerson ?? (() => { })}
                        onFocusPerson={onFocusPerson ?? (() => { })}
                      />
                    </g>
                  ))}

                  {layout.nodes.filter((n) => n.type === "union").map((node) => (
                    <g key={node.id} opacity={activeGhostNodeId ? 0.08 : 1}>
                      {UNION_DOT_R > 0 && (
                        <circle cx={node.x + UNION_R} cy={node.y + UNION_R} r={UNION_DOT_R} fill="var(--union-dot-color)" />
                      )}
                    </g>
                  ))}
                </g>
              </svg>

              {activeGhostNodeId && (
                <div className="ghost-overlay" onClick={() => setActiveGhostNodeId(null)} style={{ position: "absolute", inset: 0 }} />
              )}

              {activeGhostNodeId && activeNode && (
                <svg width={canvasW} height={canvasH} style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", zIndex: 15 }} overflow="visible">
                  <g transform={`translate(${CANVAS_PADDING}, ${CANVAS_PADDING})`}>
                    <g pointerEvents="none">
                      <PersonNode
                        node={activeNode}
                        isSelected={false}
                        isFocus={false}
                        isGhostActive={true}
                        unionCount={0}
                        onSelect={() => { }}
                        onAddRelative={() => { }}
                        onEditPerson={() => { }}
                        onFocusPerson={() => { }}
                      />
                    </g>
                    {ghostSlots.map((slot) => {
                      const { dx, dy } = getSlotOffset(slot.position);
                      const gx = activeNode.x + dx;
                      const gy = activeNode.y + dy;
                      const d = ghostLinePath(activeNode, gx, gy, slot.position);
                      const isFemale = slot.type === "mother" || slot.type === "daughter" || slot.type === "sister";
                      return (
                        <g key={slot.type} style={{ pointerEvents: "all" }}>
                          <path d={d} fill="none" stroke="var(--edge-color-ghost)" strokeWidth={GHOST_LINE_W} strokeOpacity={GHOST_LINE_OPACITY} strokeLinecap="round" />
                          <GhostNode x={gx} y={gy} label={slot.label} isFemale={isFemale} onClick={(e) => { e.stopPropagation(); handleGhostClick(activeGhostNodeId, slot.type); }} />
                        </g>
                      );
                    })}
                  </g>
                </svg>
              )}
            </div>

            {activeGhostNodeId && (
              <button className="ghost-close-btn" onClick={() => setActiveGhostNodeId(null)} style={{ zIndex: 20 }}>
                Cerrar ✕
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}