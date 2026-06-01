export default function TreeContextBar({
  treeOwner,
  focusPerson,
  totalPersons,
  renderedPersons,
  onOpenFocusPerson,
}) {
  return (
    <div className="context-bar">

      <button
        className="context-bar__focus-btn"
        onClick={onOpenFocusPerson}
        title="Abrir ficha de la persona foco"
      >
        ›
      </button>

      <div className="context-bar__breadcrumb">
        {treeOwner && (
          <>
            <span className="context-bar__tree-label">Árbol</span>
            <span className="context-bar__owner-badge">{treeOwner}</span>
          </>
        )}
        {treeOwner && focusPerson && (
          <span className="context-bar__sep">›</span>
        )}
        {focusPerson && (
          <span className="context-bar__focus-badge">
            Foco: {focusPerson}
          </span>
        )}
      </div>

      {totalPersons != null && (
        <span className="context-bar__count">
          <strong>{renderedPersons ?? "–"}</strong> de <strong>{totalPersons}</strong> personas
        </span>
      )}

    </div>
  );
}