import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import { layoutFamilyGraph } from "../graph/layoutFamilyGraph.js";
import {
  PERSON_W, PERSON_H,
  AVATAR_CX, AVATAR_CY, AVATAR_R, TEXT_X,
  NODE_RADIUS, NODE_ACCENT_X, NODE_ACCENT_TOP, NODE_ACCENT_W,
  NODE_SHADOW_DX, NODE_SHADOW_DY,
  NODE_SELECTION_PAD, NODE_SELECTION_RADIUS,
  NODE_BTN_ADD_R, NODE_BTN_ADD_CY,
  NODE_NAME_MAX_CHARS,
  NODE_ICON_SIZE, NODE_ICON_EDIT_R, NODE_ICON_LINK_R, NODE_BADGE_R, NODE_BADGE_FONT,
  NODE_ICON_EDIT_CX, NODE_ICON_EDIT_CY, NODE_ICON_LINK_DX, NODE_ICON_LINK_DY,
  NODE_BADGE_DX, NODE_BADGE_DY,
  UNION_R, UNION_DOT_R,
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
  const hasFather = edges.some((e) => e.target === nodeId && e.type === "father");
  const hasMother = edges.some((e) => e.target === nodeId && e.type === "mother");
  const hasSpouse = edges.some((e) =>
    (e.type === "spouse" || e.type === "co_parent") && (
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
      <circle cx={x + GHOST_AVATAR_CX} cy={y + GHOST_H / 2} r={17} fill="var(--ghost-avatar-bg)" />
      <circle cx={x + GHOST_AVATAR_CX} cy={y + GHOST_H / 2 - 6} r={6.5} fill="var(--ghost-avatar-fill)" />
      <ellipse cx={x + GHOST_AVATAR_CX} cy={y + GHOST_H / 2 + 9} rx={11} ry={7.5} fill="var(--ghost-avatar-fill)" />
      <text x={x + GHOST_TEXT_X} y={y + GHOST_H / 2 + 5} fontSize="var(--ghost-node-font)" fill="var(--ghost-node-text)" fontWeight="600" fontFamily="system-ui, sans-serif">
        {label}
      </text>
    </g>
  );
}

function PersonNode({ node, isSelected, isFocus, isGhostActive, unionCount, hasExternalTree, onSelect, onAddRelative, onEditPerson, onFocusPerson }) {
  const { x, y } = node;
  const isMale = node.data.gender === "male";

  const accentColor = isFocus ? "var(--node-focus-accent)" : isMale ? "var(--node-male-accent)" : "var(--node-female-accent)";
  const bgColor = isGhostActive ? "var(--node-active-bg)" : isFocus ? "var(--node-focus-bg)" : isMale ? "var(--node-male-bg)" : "var(--node-female-bg)";
  const borderColor = isGhostActive ? (isMale ? "var(--node-active-border-male)" : "var(--node-active-border-female)") : isFocus ? "var(--node-focus-border)" : isMale ? "var(--node-male-border)" : "var(--node-female-border)";
  const sw = isGhostActive ? 2.5 : isFocus ? 2.5 : 1.5;

  const name = (() => {
    const n = node.data.name ?? "—";
    return n.length > NODE_NAME_MAX_CHARS ? n.slice(0, NODE_NAME_MAX_CHARS - 1) + "…" : n;
  })();

  const dates = node.data.birth_year ? String(node.data.birth_year) : "?";

  const badgeCX = x + NODE_BADGE_DX;
  const badgeCY = y + NODE_BADGE_DY;
  const linkCX = x + NODE_ICON_LINK_DX;
  const linkCY = y + NODE_ICON_LINK_DY;
  const editCX = x + NODE_ICON_EDIT_CX;
  const editCY = y + NODE_ICON_EDIT_CY;

  return (
    <g style={{ cursor: "pointer" }} onClick={() => onSelect(node.id)}>
      {isSelected && !isGhostActive && (
        <rect x={x - NODE_SELECTION_PAD} y={y - NODE_SELECTION_PAD} width={PERSON_W + NODE_SELECTION_PAD * 2} height={PERSON_H + NODE_SELECTION_PAD * 2} rx={NODE_SELECTION_RADIUS} fill="var(--node-selection-bg)" stroke="var(--node-selection-border)" strokeWidth={1} strokeDasharray="4,2" />
      )}
      <rect x={x + NODE_SHADOW_DX} y={y + NODE_SHADOW_DY} width={PERSON_W} height={PERSON_H} rx={NODE_RADIUS} fill="var(--node-shadow-color)" />
      <rect x={x} y={y} width={PERSON_W} height={PERSON_H} rx={NODE_RADIUS} fill={bgColor} stroke={borderColor} strokeWidth={sw} />
      <line x1={x + NODE_ACCENT_X} y1={y + NODE_ACCENT_TOP} x2={x + NODE_ACCENT_X} y2={y + PERSON_H - NODE_ACCENT_TOP} stroke={accentColor} strokeWidth={NODE_ACCENT_W} strokeLinecap="round" />
      <PersonAvatar cx={x + AVATAR_CX} cy={y + AVATAR_CY} r={AVATAR_R} />
      <text x={x + TEXT_X} y={y + 22} fontSize="var(--node-font-name)" fontWeight="700" fill="var(--node-text-name)" fontFamily="system-ui, sans-serif">{name}</text>
      <text x={x + TEXT_X} y={y + 38} fontSize="var(--node-font-date)" fill="var(--node-text-date)">{dates}</text>

      {unionCount > 1 && (
        <g>
          <circle cx={badgeCX} cy={badgeCY} r={NODE_BADGE_R} fill="var(--icon-badge-bg)" />
          <text x={badgeCX} y={badgeCY + 4} textAnchor="middle" fontSize={NODE_BADGE_FONT} fontWeight="bold" fill="var(--icon-badge-text)" fontFamily="system-ui, sans-serif">x{unionCount}</text>
        </g>
      )}

      {!isGhostActive && hasExternalTree && (
        <g onClick={(e) => { e.stopPropagation(); onFocusPerson(node.id); }} style={{ cursor: "pointer" }}>
          <circle cx={linkCX} cy={linkCY} r={NODE_ICON_LINK_R} fill="var(--icon-link-bg)" stroke={accentColor} strokeWidth={1.5} />
          <use href="/icons.svg#icon-link-tree" x={linkCX - NODE_ICON_SIZE / 2} y={linkCY - NODE_ICON_SIZE / 2} width={NODE_ICON_SIZE} height={NODE_ICON_SIZE} stroke={accentColor} color={accentColor} />
        </g>
      )}

      {!isGhostActive && (
        <g onClick={(e) => { e.stopPropagation(); onEditPerson(node.id); }} style={{ cursor: "pointer" }}>
          <circle cx={editCX} cy={editCY} r={NODE_ICON_EDIT_R} fill="var(--icon-edit-bg)" stroke={accentColor} strokeWidth={1} opacity={0.9} />
          <use href="/icons.svg#icon-edit" x={editCX - NODE_ICON_SIZE / 2} y={editCY - NODE_ICON_SIZE / 2} width={NODE_ICON_SIZE} height={NODE_ICON_SIZE} stroke={accentColor} color={accentColor} />
        </g>
      )}

      <g onClick={(e) => { e.stopPropagation(); onAddRelative(node.id); }} style={{ cursor: "pointer" }}>
        <circle cx={x + PERSON_W / 2} cy={y + PERSON_H + NODE_BTN_ADD_CY} r={NODE_BTN_ADD_R} fill="white" stroke={accentColor} strokeWidth={1.5} opacity={0.85} />
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
    : 400;

  const canvasH = layout.nodes.length
    ? Math.max(...layout.nodes.map((n) => n.y + (n.type === "union" ? UNION_R * 2 : PERSON_H))) + CANVAS_PADDING * 2 + GHOST_H + CANVAS_PADDING
    : 200;

  useEffect(() => {
    if (!wrapperRef.current || layout.nodes.length === 0) return;
    const wrapper = wrapperRef.current;
    const wW = wrapper.clientWidth;
    const wH = wrapper.clientHeight;
    const centerX = (wW - canvasW * zoom) / 2;
    const centerY = (wH - canvasH * zoom) / 2;
    setPan({ x: centerX, y: centerY });
  }, [layout.nodes.length, canvasW, canvasH]);

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
    if (activeGhostNodeId) return node.id === activeGhostNodeId ? 1 : 0.15;
    if (!searchQuery) return 1;
    const name = (node.data?.name ?? "").toLowerCase();
    return name.includes(searchQuery.toLowerCase()) ? 1 : 0.18;
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

  const personHasAncestors = useMemo(() => {
    const result = new Set();
    for (const edge of layout.edges) {
      if (edge.type === "father" || edge.type === "mother" || edge.type === "child_of") {
        result.add(edge.target);
      }
    }
    return result;
  }, [layout.edges]);

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
                  <pattern id="grid" width={40} height={40} patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth={0.5} />
                  </pattern>
                </defs>
                <rect width={canvasW} height={canvasH} fill="url(#grid)" />

                <g transform={`translate(${CANVAS_PADDING}, ${CANVAS_PADDING})`}>
                  {layout.edges.map((edge) => {
                    const src = nodeMap.get(edge.source);
                    const tgt = nodeMap.get(edge.target);
                    if (!src || !tgt) return null;
                    const d = edgePath(src, tgt);
                    const isSpouse = edge.type === "spouse";
                    const isCoParent = edge.type === "co_parent";
                    const dissolved = edge.until_year !== null;
                    return (
                      <path key={edge.id} d={d} fill="none"
                        stroke={
                          isCoParent
                            ? "var(--edge-color-co-parent)"
                            : isSpouse
                              ? (dissolved ? "var(--edge-color-dissolved)" : "var(--edge-color-spouse)")
                              : "var(--edge-color-parent)"
                        }
                        strokeWidth={isSpouse || isCoParent ? EDGE_STROKE_SPOUSE : EDGE_STROKE_PARENT}
                        strokeDasharray={
                          isCoParent ? "6,4" :
                            isSpouse && dissolved ? "5,3" : undefined
                        }
                        strokeLinecap="round" strokeLinejoin="round"
                        strokeOpacity={activeGhostNodeId ? 0.08 : 0.8}
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
                        hasExternalTree={!personHasAncestors.has(node.id) && (personUnionCount.get(node.id) ?? 0) > 0}
                        onSelect={onSelectNode ?? (() => { })}
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
                        hasExternalTree={false}
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