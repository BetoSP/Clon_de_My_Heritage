// ── Icons ───────────────────────────────────────────────────────────────────
function IconFamilia() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="icon-md">
      <path d="M9 12H1v6a2 2 0 002 2h14a2 2 0 002-2v-6h-8v2H9v-2z" />
      <path d="M13 10V7a1 1 0 00-1-1H8a1 1 0 00-1 1v3H2V8a2 2 0 012-2h1V5a5 5 0 0110 0v1h1a2 2 0 012 2v2h-5z" />
    </svg>
  );
}

function IconCompact() {
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

function IconSearch() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="search-icon">
      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="icon-sm">
      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
    </svg>
  );
}

const VIEW_MODES = [
  { id: "familia", label: "Vista familiar", Icon: IconFamilia },
  { id: "compacto", label: "Compacto", Icon: IconCompact },
  { id: "foto", label: "Fotos", Icon: IconFotos },
  { id: "lista", label: "Lista", Icon: IconLista },
];

export default function TreeControlPanel({
  viewMode,
  onViewModeChange,
  generationsCount,
  onGenerationsChange,
  searchQuery,
  onSearchChange,
  onAddPerson,
}) {
  return (
    <div className="control-strip">

      {/* ─ View modes ─ */}
      <div className="control-strip__section">
        <span className="control-strip__label">Vista:</span>
        <div className="view-mode-group">
          {VIEW_MODES.map(({ id, label, Icon }) => (
            <button
              key={id}
              title={label}
              onClick={() => onViewModeChange(id)}
              className={`view-mode-btn${viewMode === id ? " view-mode-btn--active" : ""}`}
            >
              <Icon />
            </button>
          ))}
        </div>
      </div>

      <div className="control-strip__divider" />

      {/* ─ Generations ─ */}
      <div className="control-strip__section">
        <span className="control-strip__label">Generaciones:</span>
        <div className="gen-control">
          <span className="gen-value">{generationsCount}+</span>
          <input
            type="range"
            min={1}
            max={8}
            value={generationsCount}
            onChange={(e) => onGenerationsChange(Number(e.target.value))}
            className="gen-slider"
          />
        </div>
      </div>

      <div className="control-strip__divider" />

      {/* ─ Search ─ */}
      <div className="control-strip__section">
        <div className="search-wrap">
          <IconSearch />
          <input
            type="text"
            placeholder="Buscar una persona..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => onSearchChange("")}>
              ✕
            </button>
          )}
        </div>
        <button className="strip-icon-btn" title="Configuración">
          <IconSettings />
        </button>
      </div>

      <div className="control-strip__divider" />

      {/* ─ Agregar persona ─ */}
      <div className="control-strip__section">
        <button className="btn-add-person" onClick={onAddPerson} title="Agregar persona sin vinculación">
          + Agregar persona
        </button>
      </div>

    </div>
  );
}