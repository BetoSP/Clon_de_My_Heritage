import { useState } from "react";
import { computeFullSurnames } from "../utils/personUtils.js";

const DATE_PRECISION = ["Exactamente", "Antes de", "Después de", "Alrededor de"];

function DateFields({ label, precision, onPrecision, day, onDay, month, onMonth, year, onYear }) {
    return (
        <div className="modal-field-row" style={{ flexDirection: "column", gap: 6 }}>
            <label className="modal-label">{label}</label>
            <div className="modal-field-row">
                <div className="modal-field modal-field--sm">
                    <select className="form-select" value={precision} onChange={(e) => onPrecision(e.target.value)}>
                        {DATE_PRECISION.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
                <div className="modal-field modal-field--sm">
                    <input className="form-input" type="number" min="1" max="31" placeholder="Día" value={day} onChange={(e) => onDay(e.target.value)} />
                </div>
                <div className="modal-field modal-field--sm">
                    <select className="form-select" value={month} onChange={(e) => onMonth(e.target.value)}>
                        <option value="">Mes</option>
                        {["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"].map((m, i) => (
                            <option key={i} value={i + 1}>{m}</option>
                        ))}
                    </select>
                </div>
                <div className="modal-field modal-field--sm">
                    <input className="form-input" type="number" min="1000" max="2100" placeholder="Año" value={year} onChange={(e) => onYear(e.target.value)} />
                </div>
            </div>
        </div>
    );
}

export default function PersonModal({ person, people = [], relationships = [], onSave, onDelete, onAddRelationship, onClose }) {
    const isEditing = person !== null && person !== undefined;

    const [gender, setGender] = useState(isEditing ? (person.gender ?? "male") : "male");
    const [prefix, setPrefix] = useState(isEditing ? (person.prefix ?? "") : "");
    const [nombre, setNombre] = useState(isEditing ? (person.name ?? "") : "");
    const [suffix, setSuffix] = useState(isEditing ? (person.suffix ?? "") : "");
    const [surname1, setSurname1] = useState(isEditing ? (person.surname_1 ?? "") : "");
    const [surname2, setSurname2] = useState(isEditing ? (person.surname_2 ?? "") : "");
    const [surnameMarried, setSurnameMarried] = useState(isEditing ? (person.surname_married ?? "") : "");

    const [birthPrec, setBirthPrec] = useState("Exactamente");
    const [birthDay, setBirthDay] = useState(isEditing ? (person.birth_day ?? "") : "");
    const [birthMonth, setBirthMonth] = useState(isEditing ? (person.birth_month ?? "") : "");
    const [birthYear, setBirthYear] = useState(isEditing ? (person.birth_year ?? "") : "");
    const [birthPlace, setBirthPlace] = useState(isEditing ? (person.birth_place ?? "") : "");

    const [isAlive, setIsAlive] = useState(isEditing ? (person.is_alive ?? true) : true);

    const [deathPrec, setDeathPrec] = useState("Exactamente");
    const [deathDay, setDeathDay] = useState(isEditing ? (person.death_day ?? "") : "");
    const [deathMonth, setDeathMonth] = useState(isEditing ? (person.death_month ?? "") : "");
    const [deathYear, setDeathYear] = useState(isEditing ? (person.death_year ?? "") : "");
    const [deathPlace, setDeathPlace] = useState(isEditing ? (person.death_place ?? "") : "");
    const [deathCause, setDeathCause] = useState(isEditing ? (person.death_cause ?? "") : "");
    const [burialPlace, setBurialPlace] = useState(isEditing ? (person.burial_place ?? "") : "");

    const [adopted, setAdopted] = useState(isEditing ? (person.adopted ?? false) : false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    // ── Progenitores faltantes ────────────────────────────────────────────
    const [newFatherId, setNewFatherId] = useState("");
    const [newMotherId, setNewMotherId] = useState("");

    const hasFather = isEditing && relationships.some(
        (r) => r.type === "father" && String(r.person_b_id) === String(person.id)
    );
    const hasMother = isEditing && relationships.some(
        (r) => r.type === "mother" && String(r.person_b_id) === String(person.id)
    );

    const candidateFathers = people.filter(
        (p) => String(p.id) !== String(person?.id) && p.gender !== "female"
    );
    const candidateMothers = people.filter(
        (p) => String(p.id) !== String(person?.id) && p.gender !== "male"
    );

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
            surnames: computeFullSurnames(s1, s2, sm, gender),
            prefix: prefix.trim() || null,
            suffix: suffix.trim() || null,
            gender,
            adopted,
            is_alive: isAlive,
            birth_day: birthDay ? Number(birthDay) : null,
            birth_month: birthMonth ? Number(birthMonth) : null,
            birth_year: birthYear ? Number(birthYear) : null,
            birth_place: birthPlace.trim() || null,
            death_day: !isAlive && deathDay ? Number(deathDay) : null,
            death_month: !isAlive && deathMonth ? Number(deathMonth) : null,
            death_year: !isAlive && deathYear ? Number(deathYear) : null,
            death_place: !isAlive ? (deathPlace.trim() || null) : null,
            death_cause: !isAlive ? (deathCause.trim() || null) : null,
            burial_place: !isAlive ? (burialPlace.trim() || null) : null,
        });
    }

    function handleDelete() {
        if (!confirmDelete) { setConfirmDelete(true); return; }
        onDelete(person.id);
    }

    function handleAddFather() {
        if (!newFatherId) return;
        onAddRelationship({
            person_a_id: Number(newFatherId),
            person_b_id: Number(person.id),
            type: "father",
        });
        setNewFatherId("");
    }

    function handleAddMother() {
        if (!newMotherId) return;
        onAddRelationship({
            person_a_id: Number(newMotherId),
            person_b_id: Number(person.id),
            type: "mother",
        });
        setNewMotherId("");
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

                {/* Prefijo + Nombre + Sufijo */}
                <div className="modal-field-row">
                    <div className="modal-field modal-field--sm">
                        <label className="modal-label">Prefijo</label>
                        <input className="form-input" type="text" value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder="Dr., Sr..." />
                    </div>
                    <div className="modal-field">
                        <label className="modal-label">Nombre/s</label>
                        <input className="form-input" type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre/s" autoFocus />
                    </div>
                    <div className="modal-field modal-field--sm">
                        <label className="modal-label">Sufijo</label>
                        <input className="form-input" type="text" value={suffix} onChange={(e) => setSuffix(e.target.value)} placeholder="Jr., III..." />
                    </div>
                </div>

                {/* Apellidos */}
                <div className="modal-field-row">
                    <div className="modal-field">
                        <label className="modal-label">Primer apellido</label>
                        <input className="form-input" type="text" value={surname1} onChange={(e) => setSurname1(e.target.value)} placeholder="Primer apellido" />
                    </div>
                    <div className="modal-field">
                        <label className="modal-label">Segundo apellido</label>
                        <input className="form-input" type="text" value={surname2} onChange={(e) => setSurname2(e.target.value)} placeholder="Segundo apellido" />
                    </div>
                </div>
                {gender === "female" && (
                    <div className="modal-field-row">
                        <div className="modal-field modal-field--full">
                            <label className="modal-label">Apellido de casada (opcional)</label>
                            <input className="form-input" type="text" value={surnameMarried} onChange={(e) => setSurnameMarried(e.target.value)} placeholder="Apellido de casada" />
                        </div>
                    </div>
                )}

                {/* Fecha de nacimiento */}
                <DateFields
                    label="Fecha de nacimiento"
                    precision={birthPrec} onPrecision={setBirthPrec}
                    day={birthDay} onDay={setBirthDay}
                    month={birthMonth} onMonth={setBirthMonth}
                    year={birthYear} onYear={setBirthYear}
                />

                {/* Lugar de nacimiento */}
                <div className="modal-field-row">
                    <div className="modal-field modal-field--full">
                        <label className="modal-label">Lugar de nacimiento</label>
                        <input className="form-input" type="text" value={birthPlace} onChange={(e) => setBirthPlace(e.target.value)} placeholder="Ciudad, País..." />
                    </div>
                </div>

                {/* Vivo / Fallecido */}
                <div className="modal-field-row">
                    <label className="modal-radio-label">
                        <input type="radio" name="isAlive" checked={isAlive} onChange={() => setIsAlive(true)} />
                        Vivo
                    </label>
                    <label className="modal-radio-label">
                        <input type="radio" name="isAlive" checked={!isAlive} onChange={() => setIsAlive(false)} />
                        Fallecido
                    </label>
                </div>

                {/* Campos de fallecimiento */}
                {!isAlive && (
                    <>
                        <DateFields
                            label="Fecha de fallecimiento"
                            precision={deathPrec} onPrecision={setDeathPrec}
                            day={deathDay} onDay={setDeathDay}
                            month={deathMonth} onMonth={setDeathMonth}
                            year={deathYear} onYear={setDeathYear}
                        />
                        <div className="modal-field-row">
                            <div className="modal-field modal-field--full">
                                <label className="modal-label">Lugar de fallecimiento</label>
                                <input className="form-input" type="text" value={deathPlace} onChange={(e) => setDeathPlace(e.target.value)} placeholder="Ciudad, País..." />
                            </div>
                        </div>
                        <div className="modal-field-row">
                            <div className="modal-field">
                                <label className="modal-label">Causa de fallecimiento</label>
                                <input className="form-input" type="text" value={deathCause} onChange={(e) => setDeathCause(e.target.value)} placeholder="Causa..." />
                            </div>
                            <div className="modal-field">
                                <label className="modal-label">Lugar de sepultura</label>
                                <input className="form-input" type="text" value={burialPlace} onChange={(e) => setBurialPlace(e.target.value)} placeholder="Cementerio..." />
                            </div>
                        </div>
                    </>
                )}

                {/* Adoptado */}
                <div className="modal-field-row">
                    <label className="modal-radio-label">
                        <input type="checkbox" checked={adopted} onChange={(e) => setAdopted(e.target.checked)} />
                        Esta persona fue adoptada
                    </label>
                </div>

                {/* ── Progenitores faltantes (solo en modo edición) ─────── */}
                {isEditing && (!hasFather || !hasMother) && (
                    <div style={{ borderTop: "1px solid var(--color-border-light)", paddingTop: 12 }}>
                        <label className="modal-label" style={{ marginBottom: 8, display: "block" }}>
                            Progenitores faltantes
                        </label>

                        {!hasFather && (
                            <div className="modal-field-row" style={{ alignItems: "flex-end" }}>
                                <div className="modal-field">
                                    <label className="modal-label">Padre</label>
                                    <select
                                        className="form-select"
                                        value={newFatherId}
                                        onChange={(e) => setNewFatherId(e.target.value)}
                                    >
                                        <option value="">Seleccionar padre...</option>
                                        {candidateFathers.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} {p.surnames ?? ""}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    className="btn-primary"
                                    onClick={handleAddFather}
                                    disabled={!newFatherId}
                                    style={{ flexShrink: 0 }}
                                >
                                    Agregar
                                </button>
                            </div>
                        )}

                        {!hasMother && (
                            <div className="modal-field-row" style={{ alignItems: "flex-end", marginTop: 8 }}>
                                <div className="modal-field">
                                    <label className="modal-label">Madre</label>
                                    <select
                                        className="form-select"
                                        value={newMotherId}
                                        onChange={(e) => setNewMotherId(e.target.value)}
                                    >
                                        <option value="">Seleccionar madre...</option>
                                        {candidateMothers.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} {p.surnames ?? ""}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    className="btn-primary"
                                    onClick={handleAddMother}
                                    disabled={!newMotherId}
                                    style={{ flexShrink: 0 }}
                                >
                                    Agregar
                                </button>
                            </div>
                        )}
                    </div>
                )}

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