import { useEffect, useRef, useMemo, useState } from "react";
import { layoutFamilyGraph } from "../graph/layoutFamilyGraph.js";
import {
  PERSON_W, PERSON_H,
  AVATAR_CX, AVATAR_CY, AVATAR_R, TEXT_X,
  NODE_RADIUS, NODE_ACCENT_X, NODE_ACCENT_TOP, NODE_ACCENT_W,
  NODE_SHADOW_DX, NODE_SHADOW_DY,
  NODE_SELECTION_PAD, NODE_SELECTION_RADIUS,
  NODE_BTN_EDIT_R, NODE_BTN_EDIT_CY,
  NODE_BTN_ADD_R, NODE_BTN_ADD_CY,
  NODE_NAME_MAX_CHARS,
  UNION_R, UNION_DOT_R,
  CANVAS_PADDING,
  EDGE_STROKE_PARENT, EDGE_STROKE_SPOUSE,
  GHOST_W, GHOST_H,
  GHOST_RADIUS, GHOST_AVATAR_CX, GHOST_STROKE_W,
  GHOST_TEXT_X, GHOST_SHADOW_DX, GHOST_SHADOW_DY,
  GHOST_LINE_W, GHOST_LINE_OPACITY,
  elbowPath, ghostLinePath, getSlotOffset,
} from "../graph/geometry.js";

// ── Edge path para el árbol real ──────────────────────────────────────────
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

// ── Ícono de persona ──────────────────────────────────────────────────────
function PersonAvatar({ cx, cy, r }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="var(--avatar-bg)" />
      <circle cx={cx} cy={cy - r * 0.35} r={r * 0.38} fill="var(--avatar-fill)" />
      <ellipse cx={cx} cy={cy + r * 0.6} rx={r * 0.68} ry={r * 0.48} fill="var(--avatar-fill)" />
    </g>
  );
}

// ── Slots vacantes ────────────────────────────────────────────────────────
function getVacantSlots(nodeId, edges, nodes) {
  const hasFather = edges.some((e) => e.target === nodeId && e.type === "father");
  const hasMother = edges.some((e) => e.target === nodeId && e.type === "mother");
  const hasSpouse = edges.some((e) =>
    e.type === "spouse" && (
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

// ── Nodo fantasma ─────────────────────────────────────────────────────────
function GhostNode({ x, y, label, isFemale, onClick }) {
  const borderColor = isFemale ? "var(--edge-color-spouse)" : "var(--edge-color-parent)";
  return (
    <g onClick={onClick} style={{ cursor: "pointer" }}>
      <rect
        x={x + GHOST_SHADOW_DX} y={y + GHOST_SHADOW_DY}
        width={GHOST_W} height={GHOST_H}
        rx={GHOST_RADIUS}
        fill="var(--ghost-node-shadow)"
      />
      <rect
        x={x} y={y}
        width={GHOST_W} height={GHOST_H}
        rx={GHOST_RADIUS}
        fill="var(--ghost-node-bg)"
        stroke={borderColor}
        strokeWidth={GHOST_STROKE_W}
      />
      <circle cx={x + GHOST_AVATAR_CX} cy={y + GHOST_H / 2} r={17} fill="var(--ghost-avatar-bg)" />
      <circle cx={x + GHOST_AVATAR_CX} cy={y + GHOST_H / 2 - 6} r={6.5} fill="var(--ghost-avatar-fill)" />
      <ellipse cx={x + GHOST_AVATAR_CX} cy={y + GHOST_H / 2 + 9} rx={11} ry={7.5} fill="var(--ghost-avatar-fill)" />
      <text
        x={x + GHOST_TEXT_X} y={y + GHOST_H / 2 + 5}
        fontSize="var(--ghost-node-font)"
        fill="var(--ghost-node-text)"
        fontWeight="600"
        fontFamily="system-ui, sans-serif"
      >
        {label}
      </text>
    </g>
  );
}

// ── Nodo persona ──────────────────────────────────────────────────────────
function PersonNode({ node, isSelected, isFocus, isGhostActive, onSelect, onAddRelative, onEditPerson }) {
  const { x, y } = node;
  const isMale = node.data.gender === "male";

  const accentColor = isFocus
    ? "var(--node-focus-accent)"
    : isMale ? "var(--node-male-accent)" : "var(--node-female-accent)";

  const bgColor = isGhostActive
    ? "var(--node-active-bg)"
    : isFocus ? "var(--node-focus-bg)"
      : isMale ? "var(--node-male-bg)" : "var(--node-female-bg)";

  const borderColor = isGhostActive
    ? (isMale ? "var(--node-active-border-male)" : "var(--node-active-border-female)")
    : isFocus ? "var(--node-focus-border)"
      : isMale ? "var(--node-male-border)" : "var(--node-female-border)";

  const sw = isGhostActive ? 2.5 : isFocus ? 2.5 : 1.5;

  const name = (() => {
    const n = node.data.name ?? "—";
    return n.length > NODE_NAME_MAX_CHARS ? n.slice(0, NODE_NAME_MAX_CHARS - 1) + "…" : n;
  })();

  const dates = node.data.birth_year ? String(node.data.birth_year) : "?";

  return (
    <g style={{ cursor: "pointer" }} onClick={() => onSelect(node.id)}>

      {isSelected && !isGhostActive && (
        <rect
          x={x - NODE_SELECTION_PAD} y={y - NODE_SELECTION_PAD}
          width={PERSON_W + NODE_SELECTION_PAD * 2} height={PERSON_H + NODE_SELECTION_PAD * 2}
          rx={NODE_SELECTION_RADIUS}
          fill="var(--node-selection-bg)"
          stroke="var(--node-selection-border)"
          strokeWidth={1}
          strokeDasharray="4,2"
        />
      )}

      <rect
        x={x + NODE_SHADOW_DX} y={y + NODE_SHADOW_DY}
        width={PERSON_W} height={PERSON_H}
        rx={NODE_RADIUS}
        fill="var(--node-shadow-color)"
      />
      <rect
        x={x} y={y}
        width={PERSON_W} height={PERSON_H}
        rx={NODE_RADIUS}
        fill={bgColor}
        stroke={borderColor}
        strokeWidth={sw}
      />
      <line
        x1={x + NODE_ACCENT_X} y1={y + NODE_ACCENT_TOP}
        x2={x + NODE_ACCENT_X} y2={y + PERSON_H - NODE_ACCENT_TOP}
        stroke={accentColor}
        strokeWidth={NODE_ACCENT_W}
        strokeLinecap="round"
      />
      <PersonAvatar cx={x + AVATAR_CX} cy={y + AVATAR_CY} r={AVATAR_R} />

      <text
        x={x + TEXT_X} y={y + 22}
        fontSize="var(--node-font-name)"
        fontWeight="700"
        fill="var(--node-text-name)"
        fontFamily="system-ui, sans-serif"
      >
        {name}
      </text>
      <text
        x={x + TEXT_X} y={y + 38}
        fontSize="var(--node-font-date)"
        fill="var(--node-text-date)"
      >
        {dates}
      </text>

      {!isGhostActive && (
        <g onClick={(e) => { e.stopPropagation(); onEditPerson(node.id); }} style={{ cursor: "pointer" }}>
          <circle
            cx={x + PERSON_W - NODE_BTN_EDIT_R - 5}
            cy={y + NODE_BTN_EDIT_CY}
            r={NODE_BTN_EDIT_R}
            fill="white" stroke={accentColor} strokeWidth={1} opacity={0.8}
          />
          <text
            x={x + PERSON_W - NODE_BTN_EDIT_R - 5}
            y={y + NODE_BTN_EDIT_CY + 4}
            textAnchor="middle"
            fontSize="var(--node-btn-font)"
            fill={accentColor}
          >✏</text>
        </g>
      )}

      <g onClick={(e) => { e.stopPropagation(); onAddRelative(node.id); }} style={{ cursor: "pointer" }}>
        <circle
          cx={x + PERSON_W / 2}
          cy={y + PERSON_H + NODE_BTN_ADD_CY}
          r={NODE_BTN_ADD_R}
          fill="white" stroke={accentColor} strokeWidth={1.5} opacity={0.85}
        />
        <text
          x={x + PERSON_W / 2}
          y={y + PERSON_H + NODE_BTN_ADD_CY + 5}
          textAnchor="middle"
          fontSize="var(--node-btn-add-font)"
          fill={accentColor}
          fontWeight="300"
        >+</text>
      </g>

    </g>
  );
}

// ── Dissolve cell ─────────────────────────────────────────────────────────
function DissolveCell({ edge, dissolvingRelId, dissolveYear, setDissolvingRelId, setDissolveYear, onDissolveSpouse, spouseRelId }) {
  const relId = spouseRelId(edge.id);
  const isDissolving = dissolvingRelId === relId;

  if (isDissolving) {
    return (
      <span className="dissolve-wrap">
        <input type="number" value={dissolveYear}
          onChange={(e) => setDissolveYear(e.target.value)}
          placeholder="Año" className="dissolve-year-input" />
        <button onClick={() => {
          if (!dissolveYear) return;
          onDissolveSpouse?.(relId, Number(dissolveYear));
          setDissolvingRelId(null); setDissolveYear("");
        }} className="btn-dissolve-confirm">✓</button>
        <button onClick={() => { setDissolvingRelId(null); setDissolveYear(""); }}
          className="btn-dissolve-cancel">✕</button>
      </span>
    );
  }

  return (
    <button onClick={() => setDissolvingRelId(relId)} className="btn-dissolve-trigger">
      activo · disolver
    </button>
  );
}

// ── Main GraphView ────────────────────────────────────────────────────────
export default function GraphView({
  graph,
  onDissolveSpouse,
  focusNodeId = null,
  selectedNodeId = null,
  onSelectNode = null,
  onAddRelative = null,
  onEditPerson = null,
  onDeletePerson = null,
  searchQuery = "",
}) {
  const layout = useMemo(() => layoutFamilyGraph(graph), [graph]);
  const nodeMap = useMemo(
    () => new Map(layout.nodes.map((n) => [n.id, n])),
    [layout.nodes]
  );

  const [dissolvingRelId, setDissolvingRelId] = useState(null);
  const [dissolveYear, setDissolveYear] = useState("");
  const [activeGhostNodeId, setActiveGhostNodeId] = useState(null);

  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!activeGhostNodeId || !wrapperRef.current) return;
    const node = nodeMap.get(activeGhostNodeId);
    if (!node) return;
    const wrapper = wrapperRef.current;
    wrapper.scrollTo({
      left: node.x + PERSON_W / 2 + CANVAS_PADDING - wrapper.clientWidth / 2,
      top: node.y + PERSON_H / 2 + CANVAS_PADDING - wrapper.clientHeight / 2,
      behavior: "smooth",
    });
  }, [activeGhostNodeId, nodeMap]);

  function spouseRelId(edgeId) {
    return parseInt(edgeId.split("-")[1], 10);
  }

  function nodeOpacity(node) {
    if (activeGhostNodeId) return node.id === activeGhostNodeId ? 1 : 0.15;
    if (!searchQuery) return 1;
    const name = (node.data?.name ?? "").toLowerCase();
    return name.includes(searchQuery.toLowerCase()) ? 1 : 0.18;
  }

  function labelOf(id) {
    const n = nodeMap.get(id);
    if (!n) return id;
    if (n.type === "person") return n.data.name ?? id;
    return `Unión ${n.data.person_a_id}–${n.data.person_b_id}`;
  }

  function handleAddRelative(nodeId) {
    setActiveGhostNodeId((prev) => prev === nodeId ? null : nodeId);
  }

  function handleGhostClick(nodeId, slotType) {
    setActiveGhostNodeId(null);
    onAddRelative?.(nodeId, slotType);
  }

  const canvasW = layout.nodes.length
    ? Math.max(...layout.nodes.map((n) => n.x + (n.type === "union" ? UNION_R * 2 : PERSON_W)))
    + CANVAS_PADDING * 2 + GHOST_W + CANVAS_PADDING
    : 400;

  const canvasH = layout.nodes.length
    ? Math.max(...layout.nodes.map((n) => n.y + (n.type === "union" ? UNION_R * 2 : PERSON_H)))
    + CANVAS_PADDING * 2 + GHOST_H + CANVAS_PADDING
    : 200;

  const activeNode = activeGhostNodeId ? nodeMap.get(activeGhostNodeId) : null;
  const ghostSlots = activeNode ? getVacantSlots(activeGhostNodeId, layout.edges, layout.nodes) : [];

  return (
    <div className="graph-col">
      <div className="canvas-wrapper canvas-wrapper--relative" ref={wrapperRef}>

        {layout.nodes.length === 0 ? (
          <div className="canvas-empty">
            <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={1.5} className="canvas-empty__icon">
              <circle cx={24} cy={16} r={8} />
              <path d="M8 40c0-8.837 7.163-16 16-16s16 7.163 16 16" />
            </svg>
            <p className="canvas-empty__text">
              Sin datos. Usá "Agregar persona" para comenzar.
            </p>
          </div>
        ) : (
          <>
            {/* SVG inferior — árbol real */}
            <svg width={canvasW} height={canvasH} style={{ display: "block" }}>
              <defs>
                <pattern id="grid" width={40} height={40} patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth={0.5} />
                </pattern>
              </defs>
              <rect width={canvasW} height={canvasH} fill="url(#grid)" />

              <g transform={`translate(${CANVAS_PADDING}, ${CANVAS_PADDING})`}>

                {/* Edges */}
                {layout.edges.map((edge) => {
                  const src = nodeMap.get(edge.source);
                  const tgt = nodeMap.get(edge.target);
                  if (!src || !tgt) return null;
                  const d = edgePath(src, tgt);
                  const isSpouse = edge.type === "spouse";
                  const dissolved = edge.until_year !== null;
                  return (
                    <path key={edge.id} d={d} fill="none"
                      stroke={isSpouse
                        ? (dissolved ? "var(--edge-color-dissolved)" : "var(--edge-color-spouse)")
                        : "var(--edge-color-parent)"}
                      strokeWidth={isSpouse ? EDGE_STROKE_SPOUSE : EDGE_STROKE_PARENT}
                      strokeDasharray={isSpouse && dissolved ? "5,3" : undefined}
                      strokeLinecap="round" strokeLinejoin="round"
                      strokeOpacity={activeGhostNodeId ? 0.08 : 0.8}
                    />
                  );
                })}

                {/* Person nodes */}
                {layout.nodes.filter((n) => n.type === "person").map((node) => (
                  <g key={node.id} opacity={nodeOpacity(node)}>
                    <PersonNode
                      node={node}
                      isSelected={selectedNodeId === node.id}
                      isFocus={focusNodeId === node.id}
                      isGhostActive={activeGhostNodeId === node.id}
                      onSelect={onSelectNode ?? (() => { })}
                      onAddRelative={handleAddRelative}
                      onEditPerson={onEditPerson ?? (() => { })}
                      onDeletePerson={onDeletePerson ?? (() => { })}
                    />
                  </g>
                ))}

                {/* Union nodes */}
                {layout.nodes.filter((n) => n.type === "union").map((node) => (
                  <g key={node.id} opacity={activeGhostNodeId ? 0.08 : 1}>
                    {UNION_DOT_R > 0 && (
                      <circle
                        cx={node.x + UNION_R}
                        cy={node.y + UNION_R}
                        r={UNION_DOT_R}
                        fill="var(--union-dot-color)"
                      />
                    )}
                  </g>
                ))}

              </g>
            </svg>

            {/* Overlay oscuro */}
            {activeGhostNodeId && (
              <div className="ghost-overlay" onClick={() => setActiveGhostNodeId(null)} />
            )}

            {/* SVG superior — nodos fantasma encima del overlay */}
            {activeGhostNodeId && activeNode && (
              <svg
                width={canvasW}
                height={canvasH}
                style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", zIndex: 15 }}
              >
                <g transform={`translate(${CANVAS_PADDING}, ${CANVAS_PADDING})`}>

                  <g pointerEvents="none">
                    <PersonNode
                      node={activeNode}
                      isSelected={false}
                      isFocus={false}
                      isGhostActive={true}
                      onSelect={() => { }}
                      onAddRelative={() => { }}
                      onEditPerson={() => { }}
                      onDeletePerson={() => { }}
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
                        <path
                          d={d} fill="none"
                          stroke="var(--edge-color-ghost)"
                          strokeWidth={GHOST_LINE_W}
                          strokeOpacity={GHOST_LINE_OPACITY}
                          strokeLinecap="round"
                        />
                        <GhostNode
                          x={gx} y={gy}
                          label={slot.label}
                          isFemale={isFemale}
                          onClick={(e) => { e.stopPropagation(); handleGhostClick(activeGhostNodeId, slot.type); }}
                        />
                      </g>
                    );
                  })}

                </g>
              </svg>
            )}

            {activeGhostNodeId && (
              <button className="ghost-close-btn" onClick={() => setActiveGhostNodeId(null)}>
                Cerrar ✕
              </button>
            )}
          </>
        )}
      </div>

      {/* Tabla de relaciones */}
      <details className="rels-details">
        <summary><span>▶</span> Relaciones ({graph.edges.length})</summary>
        <div className="rels-table-wrap">
          {graph.edges.length === 0 ? (
            <p className="rels-empty-msg">Sin relaciones registradas.</p>
          ) : (
            <table className="rels-table">
              <thead>
                <tr><th>Origen</th><th>Tipo</th><th>Destino</th><th>Desde</th><th>Hasta</th></tr>
              </thead>
              <tbody>
                {graph.edges.map((edge) => (
                  <tr key={edge.id}>
                    <td className="rels-td-name">{labelOf(edge.source)}</td>
                    <td>
                      <span className={`rel-type-badge${edge.type === "spouse" ? " rel-type-badge--spouse" : ""}`}>
                        {edge.type}
                      </span>
                    </td>
                    <td className="rels-td-name">{labelOf(edge.target)}</td>
                    <td className="rels-td-muted">{edge.since_year ?? "—"}</td>
                    <td className="rels-td-muted">
                      {edge.type === "spouse" && edge.until_year === null && edge.id.endsWith("-a") ? (
                        <DissolveCell
                          edge={edge}
                          dissolvingRelId={dissolvingRelId}
                          dissolveYear={dissolveYear}
                          setDissolvingRelId={setDissolvingRelId}
                          setDissolveYear={setDissolveYear}
                          onDissolveSpouse={onDissolveSpouse}
                          spouseRelId={spouseRelId}
                        />
                      ) : (
                        edge.until_year ?? "activo"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </details>
    </div>
  );
}