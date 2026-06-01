import { useState } from "react";

const RELATIONSHIP_OPTIONS = [
    { value: "spouse", label: "Cónyuge / Pareja" },
    { value: "father", label: "Padre" },
    { value: "mother", label: "Madre" },
    { value: "child", label: "Hijo/a" },
];

const SLOT_CONFIG = {
    spouse: { fixedRole: "a", freeLabel: "Cónyuge" },
    father: { fixedRole: "b", freeLabel: "Padre" },
    mother: { fixedRole: "b", freeLabel: "Madre" },
    child: { fixedRole: "a", freeLabel: "Hijo/a" },
};

function resolveType(type) {
    if (type === "child") return "father";
    return type;
}

export default function RelationshipModal({
    relationship,
    prefillPersonId,
    prefillType,
    people,
    onSave,
    onDelete,
    onClose,
}) {
    const isEditing = relationship !== null && relationship !== undefined;
    const hasPrefill = !isEditing && prefillPersonId && prefillType;

    const initialType = isEditing
        ? relationship.type
        : hasPrefill ? resolveType(prefillType) : "spouse";

    const config = SLOT_CONFIG[prefillType] ?? SLOT_CONFIG["spouse"];
    const fixedIsA = config.fixedRole === "a";

    const initialPersonAId = isEditing
        ? String(relationship.person_a_id)
        : hasPrefill && fixedIsA ? String(prefillPersonId) : "";

    const initialPersonBId = isEditing
        ? String(relationship.person_b_id)
        : hasPrefill && !fixedIsA ? String(prefillPersonId) : "";

    const [type, setType] = useState(initialType);
    const [personAId, setPersonAId] = useState(initialPersonAId);
    const [personBId, setPersonBId] = useState(initialPersonBId);
    const [sinceYear, setSinceYear] = useState(isEditing ? (relationship.since_year ?? "") : "");
    const [untilYear, setUntilYear] = useState(isEditing ? (relationship.until_year ?? "") : "");
    const [confirmDelete, setConfirmDelete] = useState(false);

    const fixedPerson = hasPrefill ? people.find((p) => String(p.id) === String(prefillPersonId)) : null;
    const fixedPersonName = fixedPerson?.name ?? "—";

    function handleTypeChange(newType) {
        setType(newType);
        if (hasPrefill) {
            if (fixedIsA) setPersonBId("");
            else setPersonAId("");
        } else {
            setPersonAId("");
            setPersonBId("");
        }
    }

    function handleSave() {
        if (!personAId || !personBId) return;
        if (personAId === personBId) return;

        let a = Number(personAId);
        let b = Number(personBId);

        // DECISIONS.md [003]: orden canónico para spouse
        if (type === "spouse") {
            a = Math.min(Number(personAId), Number(personBId));
            b = Math.max(Number(personAId), Number(personBId));
        }

        onSave({
            ...(isEditing ? { id: relationship.id } : {}),
            person_a_id: a,
            person_b_id: b,
            type,
            since_year: sinceYear ? Number(sinceYear) : null,
            until_year: (type === "spouse" && untilYear) ? Number(untilYear) : null,
        });
    }

    function handleDelete() {
        if (!confirmDelete) { setConfirmDelete(true); return; }
        onDelete(relationship.id);
    }

    const freeOptions = people.filter((p) => String(p.id) !== String(prefillPersonId));

    const title = isEditing
        ? "Editar relación"
        : hasPrefill
            ? `Agregar ${RELATIONSHIP_OPTIONS.find((o) => o.value === type)?.label?.toLowerCase() ?? "relación"} de ${fixedPersonName}`
            : "Agregar relación";

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>

                <div className="modal-header">
                    <h2 className="modal-title">{title}</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                {/* Tipo de relación */}
                <div className="modal-field-row">
                    <div className="modal-field modal-field--full">
                        <label className="modal-label">Tipo de relación</label>
                        <select
                            className="form-select"
                            value={type}
                            onChange={(e) => handleTypeChange(e.target.value)}
                            disabled={isEditing}
                        >
                            {RELATIONSHIP_OPTIONS
                                .filter((opt) => {
                                    if (!hasPrefill) return true;
                                    if (prefillType === "child") return ["father", "mother"].includes(opt.value);
                                    if (prefillType === "spouse") return opt.value === "spouse";
                                    return opt.value === prefillType;
                                })
                                .map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                        </select>
                    </div>
                </div>

                {/* Persona fija — solo lectura */}
                {hasPrefill && (
                    <div className="modal-field-row">
                        <div className="modal-field modal-field--full">
                            <label className="modal-label">
                                {fixedIsA ? (type === "spouse" ? "Persona" : "Progenitor/a") : "Hijo/a"}
                            </label>
                            <div className="modal-fixed-person">{fixedPersonName}</div>
                        </div>
                    </div>
                )}

                {/* Persona libre */}
                {hasPrefill ? (
                    <div className="modal-field-row">
                        <div className="modal-field modal-field--full">
                            <label className="modal-label">{config.freeLabel}</label>
                            <select
                                className="form-select"
                                value={fixedIsA ? personBId : personAId}
                                onChange={(e) => fixedIsA ? setPersonBId(e.target.value) : setPersonAId(e.target.value)}
                            >
                                <option value="">Seleccionar...</option>
                                {freeOptions.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                ) : (
                    <div className="modal-field-row">
                        <div className="modal-field">
                            <label className="modal-label">Persona A</label>
                            <select
                                className="form-select"
                                value={personAId}
                                onChange={(e) => setPersonAId(e.target.value)}
                            >
                                <option value="">Seleccionar...</option>
                                {people.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="modal-field">
                            <label className="modal-label">Persona B</label>
                            <select
                                className="form-select"
                                value={personBId}
                                onChange={(e) => setPersonBId(e.target.value)}
                            >
                                <option value="">Seleccionar...</option>
                                {people
                                    .filter((p) => String(p.id) !== personAId)
                                    .map((p) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                            </select>
                        </div>
                    </div>
                )}

                {/* Años */}
                <div className="modal-field-row">
                    <div className="modal-field modal-field--sm">
                        <label className="modal-label">Año inicio</label>
                        <input
                            className="form-input"
                            type="number"
                            min="1000" max="2100"
                            value={sinceYear}
                            onChange={(e) => setSinceYear(e.target.value)}
                            placeholder="Opcional"
                        />
                    </div>
                    {type === "spouse" && (
                        <div className="modal-field modal-field--sm">
                            <label className="modal-label">Año fin</label>
                            <input
                                className="form-input"
                                type="number"
                                min="1000" max="2100"
                                value={untilYear}
                                onChange={(e) => setUntilYear(e.target.value)}
                                placeholder="Opcional"
                            />
                        </div>
                    )}
                </div>

                {/* Botones */}
                <div className="modal-actions">
                    {isEditing && (
                        <button
                            className={confirmDelete ? "btn-danger-confirm" : "btn-danger"}
                            onClick={handleDelete}
                        >
                            {confirmDelete ? "¿Confirmar eliminación?" : "Eliminar"}
                        </button>
                    )}
                    <div className="modal-actions-right">
                        <button className="btn-secondary" onClick={onClose}>Cancelar</button>
                        <button className="btn-primary" onClick={handleSave}>OK</button>
                    </div>
                </div>

            </div>
        </div>
    );
}