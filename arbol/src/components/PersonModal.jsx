import { useState } from "react";

function computeSurnames(surname_1, surname_2, surname_married, gender) {
    const base = [surname_1, surname_2].filter(Boolean).join(" ");
    if (gender === "female" && surname_married) {
        return base ? `${base} de ${surname_married}` : `de ${surname_married}`;
    }
    return base || null;
}

export default function PersonModal({ person, onSave, onDelete, onClose, suggestedSurname1, suggestedSurname2 }) {
    const isEditing = person !== null && person !== undefined;

    const [nombre, setNombre] = useState(isEditing ? (person.name ?? "") : "");
    const [surname1, setSurname1] = useState(isEditing ? (person.surname_1 ?? "") : (suggestedSurname1 ?? ""));
    const [surname2, setSurname2] = useState(isEditing ? (person.surname_2 ?? "") : (suggestedSurname2 ?? ""));
    const [surnameMarried, setSurnameMarried] = useState(isEditing ? (person.surname_married ?? "") : "");
    const [dia, setDia] = useState(isEditing ? (person.birth_day ?? "") : "");
    const [mes, setMes] = useState(isEditing ? (person.birth_month ?? "") : "");
    const [anio, setAnio] = useState(isEditing ? (person.birth_year ?? "") : "");
    const [gender, setGender] = useState(isEditing ? (person.gender ?? "male") : "male");
    const [adopted, setAdopted] = useState(isEditing ? (person.adopted ?? false) : false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    function handleSave() {
        if (!nombre.trim()) return;
        const s1 = surname1.trim() || null;
        const s2 = surname2.trim() || null;
        const sm = surnameMarried.trim() || null;
        onSave({
            ...(isEditing ? { id: person.id } : {}),
            name: nombre.trim(),
            surname_1: s1,
            surname_2: s2,
            surname_married: sm,
            surnames: computeSurnames(s1, s2, sm, gender),
            birth_day: dia ? Number(dia) : null,
            birth_month: mes ? Number(mes) : null,
            birth_year: anio ? Number(anio) : null,
            gender,
            adopted,
        });
    }

    function handleDelete() {
        if (!confirmDelete) { setConfirmDelete(true); return; }
        onDelete(person.id);
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>

                <div className="modal-header">
                    <h2 className="modal-title">
                        {isEditing ? "Editar persona" : "Agregar persona"}
                    </h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                {/* Género */}
                <div className="modal-field-row">
                    {[
                        { value: "male", label: "Hombre" },
                        { value: "female", label: "Mujer" },
                        { value: "unknown", label: "Desconocido" },
                    ].map((opt) => (
                        <label key={opt.value} className="modal-radio-label">
                            <input
                                type="radio"
                                name="gender"
                                value={opt.value}
                                checked={gender === opt.value}
                                onChange={() => setGender(opt.value)}
                            />
                            {opt.label}
                        </label>
                    ))}
                </div>

                {/* Nombre */}
                <div className="modal-field-row">
                    <div className="modal-field modal-field--full">
                        <label className="modal-label">Nombre/s</label>
                        <input
                            className="form-input"
                            type="text"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            placeholder="Nombre/s"
                        />
                    </div>
                </div>

                {/* Apellidos */}
                <div className="modal-field-row">
                    <div className="modal-field">
                        <label className="modal-label">Primer apellido</label>
                        <input
                            className="form-input"
                            type="text"
                            value={surname1}
                            onChange={(e) => setSurname1(e.target.value)}
                            placeholder="Primer apellido"
                        />
                    </div>
                    <div className="modal-field">
                        <label className="modal-label">Segundo apellido</label>
                        <input
                            className="form-input"
                            type="text"
                            value={surname2}
                            onChange={(e) => setSurname2(e.target.value)}
                            placeholder="Segundo apellido"
                        />
                    </div>
                </div>
                {gender === "female" && (
                    <div className="modal-field-row">
                        <div className="modal-field modal-field--full">
                            <label className="modal-label">Apellido de casada (opcional)</label>
                            <input
                                className="form-input"
                                type="text"
                                value={surnameMarried}
                                onChange={(e) => setSurnameMarried(e.target.value)}
                                placeholder="Apellido de casada"
                            />
                        </div>
                    </div>
                )}

                {/* Fecha de nacimiento */}
                <div className="modal-field-row">
                    <div className="modal-field modal-field--sm">
                        <label className="modal-label">Día</label>
                        <input
                            className="form-input"
                            type="number"
                            min="1" max="31"
                            value={dia}
                            onChange={(e) => setDia(e.target.value)}
                            placeholder="Día"
                        />
                    </div>
                    <div className="modal-field modal-field--sm">
                        <label className="modal-label">Mes</label>
                        <input
                            className="form-input"
                            type="number"
                            min="1" max="12"
                            value={mes}
                            onChange={(e) => setMes(e.target.value)}
                            placeholder="Mes"
                        />
                    </div>
                    <div className="modal-field modal-field--md">
                        <label className="modal-label">Año</label>
                        <input
                            className="form-input"
                            type="number"
                            min="1000" max="2100"
                            value={anio}
                            onChange={(e) => setAnio(e.target.value)}
                            placeholder="Año"
                        />
                    </div>
                </div>

                {/* Adoptado */}
                <div className="modal-field-row">
                    <label className="modal-radio-label">
                        <input
                            type="checkbox"
                            checked={adopted}
                            onChange={(e) => setAdopted(e.target.checked)}
                        />
                        Esta persona fue adoptada
                    </label>
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