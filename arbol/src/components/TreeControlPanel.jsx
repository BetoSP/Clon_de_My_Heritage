// ── Icons ─────────────────────────────────────────────────────────────────────
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

function IconContextHelp() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="icon-sm">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────────
// generationsCount  number          — generaciones a mostrar
// onGenerationsChange fn(n)         — callback al mover el slider
// searchQuery       string          — texto de búsqueda
// onSearchChange    fn(str)         — callback al cambiar búsqueda
export default function TreeControlPanel({
  generationsCount,
  onGenerationsChange,
  searchQuery,
  onSearchChange,
}) {
  return (
    <div className="control-strip">

      {/* ─ Izquierda: Generaciones ─ */}
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

      {/* ─ Centro: Buscar ─ */}
      <div className="control-strip__section control-strip__section--grow">
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
      </div>

      <div className="control-strip__divider" />

      {/* ─ Derecha: Configuración + Ayuda contextual ─ */}
      <div className="control-strip__section control-strip__section--right">
        <button className="strip-icon-btn" title="Configuración del árbol">
          <IconSettings />
        </button>
        <button className="strip-icon-btn" title="Ayuda contextual">
          <IconContextHelp />
        </button>
      </div>

    </div>
  );
}
