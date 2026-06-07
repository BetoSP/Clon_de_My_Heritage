// ── Iconos de vistas ──────────────────────────────────────────────────────────
function IconFamilia() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="icon-md">
      <path d="M9 12H1v6a2 2 0 002 2h14a2 2 0 002-2v-6h-8v2H9v-2z" />
      <path d="M13 10V7a1 1 0 00-1-1H8a1 1 0 00-1 1v3H2V8a2 2 0 012-2h1V5a5 5 0 0110 0v1h1a2 2 0 012 2v2h-5z" />
    </svg>
  );
}

function IconExpandido() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="icon-md">
      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
    </svg>
  );
}

function IconFotos() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="icon-md">
      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
    </svg>
  );
}

function IconLista() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="icon-md">
      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h4a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
    </svg>
  );
}

const CONTEXT_VIEWS = [
  { id: "familia",   label: "Vista familiar",  Icon: IconFamilia,   mvp: true  },
  { id: "expandido", label: "Árbol expandido", Icon: IconExpandido, mvp: false },
  { id: "foto",      label: "Fotos",           Icon: IconFotos,     mvp: false },
  { id: "lista",     label: "Lista",           Icon: IconLista,     mvp: false },
];

// ── Props ──────────────────────────────────────────────────────────────────────
// treeName        string          — nombre del árbol activo
// focusPerson     string|null     — nombre de la persona foco del render
// totalPersons    number|null     — total de personas en DB
// renderedPersons number|null     — personas visibles en el canvas
// viewMode        string          — vista activa ("familia" | "expandido" | ...)
// onViewModeChange fn(id)         — callback al cambiar vista
export default function TreeContextBar({
  treeName,
  focusPerson,
  totalPersons,
  renderedPersons,
  viewMode,
  onViewModeChange,
}) {
  return (
    <div className="context-bar">

      {/* ── Breadcrumb: nombre árbol | persona foco ──────────────────────── */}
      <div className="context-bar__breadcrumb">
        <span className="context-bar__tree-label">{treeName ?? "Mi árbol"}</span>
        {focusPerson && (
          <>
            <span className="context-bar__sep"> | </span>
            <span className="context-bar__focus-label">{focusPerson}</span>
          </>
        )}
      </div>

      {/* ── Contador de personas ─────────────────────────────────────────── */}
      {totalPersons != null && (
        <span className="context-bar__count">
          <strong>{renderedPersons ?? "–"}</strong> de <strong>{totalPersons}</strong> personas
        </span>
      )}

      {/* ── Vistas del árbol — extremo derecho ───────────────────────────── */}
      <div className="context-bar__views">
        {CONTEXT_VIEWS.map(({ id, label, Icon, mvp }) => (
          <button
            key={id}
            title={mvp ? label : `${label} — Próximamente`}
            disabled={!mvp}
            onClick={() => mvp && onViewModeChange?.(id)}
            className={[
              "context-bar__view-btn",
              viewMode === id ? "context-bar__view-btn--active" : "",
              !mvp ? "context-bar__view-btn--disabled" : "",
            ].filter(Boolean).join(" ")}
          >
            <Icon />
            <span className="context-bar__view-label">{label}</span>
            {!mvp && <span className="module-nav__badge-soon">Próxim.</span>}
          </button>
        ))}
      </div>

    </div>
  );
}
