export default function TreeContextBar({
  treeOwner,
  focusPerson,
  selectedPerson,
  totalPersons,
  renderedPersons,
  onOpenFocusPerson,
  onClearFocus,
}) {
  return (
    <div className="context-bar">

      {focusPerson && (
        <button
          className="context-bar__focus-btn"
          onClick={onOpenFocusPerson}
          title="Abrir ficha de la persona foco"
        >
          ›
        </button>
      )}

      <div className="context-bar__breadcrumb">
        {treeOwner && (
          <>
            <span className="context-bar__tree-label">Árbol</span>
            <span className="context-bar__owner-badge">{treeOwner}</span>
          </>
        )}
        {treeOwner && (focusPerson || selectedPerson) && (
          <span className="context-bar__sep">›</span>
        )}
        {selectedPerson ? (
          <span className="context-bar__focus-badge">{selectedPerson}</span>
        ) : focusPerson ? (
          <span className="context-bar__focus-badge">Foco: {focusPerson}</span>
        ) : (
          <span className="context-bar__tree-label">Vista completa</span>
        )}
      </div>

      {totalPersons != null && (
        <span className="context-bar__count">
          <strong>{renderedPersons ?? "–"}</strong> de <strong>{totalPersons}</strong> personas
        </span>
      )}

      {focusPerson && onClearFocus && (
        <button
          className="context-bar__clear-focus"
          onClick={onClearFocus}
          title="Limpiar foco — ver árbol completo"
        >
          ✕ Limpiar foco
        </button>
      )}

    </div>
  );
}