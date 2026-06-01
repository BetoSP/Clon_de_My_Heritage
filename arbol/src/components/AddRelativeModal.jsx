import { useState } from "react";

const DATE_PRECISION = ["Exactamente", "Antes de", "Después de", "Alrededor de"];

const SPOUSE_TYPES = [
    { value: "married", label: "Casado/a" },
    { value: "divorced", label: "Divorciado/a" },
    { value: "partner", label: "Pareja" },
    { value: "separated", label: "Separado/a" },
    { value: "unknown", label: "Desconocido" },
];

function computeSurnames(surname_1, surname_2, surname_married, gender) {
    const base = [surname_1, surname_2].filter(Boolean).join(" ");
    if (gender === "female" && surname_married) {
        return base ? `${base} de ${surname_married}` : `de ${surname_married}`;
    }
    return base || null;
}

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

export default function AddRelativeModal({
    slotType,
    fromPerson,
    otherParent,
    suggestedSurname1,
    suggestedSurname2,
    onSave,
    onClose,
}) {
    const isSpouse = slotType === "spouse" || slotType === "spouse_another";
    const isChild = slotType === "son" || slotType === "daughter";
    const isSibling = slotType === "brother" || slotType === "sister";

    const [saving, setSaving] = useState(false);

    const initialGender =
        slotType === "father" ? "male" :
            slotType === "mother" ? "female" :
                slotType === "son" ? "male" :
                    slotType === "daughter" ? "female" :
                        slotType === "brother" ? "male" :
                            slotType === "sister" ? "female" : "male";

    const [gender, setGender] = useState(initialGender);
    const [prefix, setPrefix] = useState("");
    const [nombre, setNombre] = useState("");
    const [suffix, setSuffix] = useState("");

    // Apellidos estructurados
    const [surname1, setSurname1] = useState(suggestedSurname1 ?? "");
    const [surname2, setSurname2] = useState(suggestedSurname2 ?? "");
    const [surnameMarried, setSurnameMarried] = useState("");

    const [birthPrec, setBirthPrec] = useState("Exactamente");
    const [birthDay, setBirthDay] = useState("");
    const [birthMonth, setBirthMonth] = useState("");
    const [birthYear, setBirthYear] = useState("");
    const [birthPlace, setBirthPlace] = useState("");

    const [isAlive, setIsAlive] = useState(true);

    const [deathPrec, setDeathPrec] = useState("Exactamente");
    const [deathDay, setDeathDay] = useState("");
    const [deathMonth, setDeathMonth] = useState("");
    const [deathYear, setDeathYear] = useState("");
    const [deathPlace, setDeathPlace] = useState("");
    const [deathCause, setDeathCause] = useState("");
    const [burialPlace, setBurialPlace] = useState("");

    const [spouseType, setSpouseType] = useState("married");
    const [marriagePrec, setMarriagePrec] = useState("Exactamente");
    const [marriageDay, setMarriageDay] = useState("");
    const [marriageMonth, setMarriageMonth] = useState("");
    const [marriageYear, setMarriageYear] = useState("");
    const [marriagePlace, setMarriagePlace] = useState("");

    const [otherParentChoice, setOtherParentChoice] = useState(
        otherParent ? String(otherParent.id) : "none"
    );

    function getTitle() {
        const name = fromPerson?.name ?? "";
        const surn = fromPerson?.surnames ?? "";
        const full = [name, surn].filter(Boolean).join(" ");
        switch (slotType) {
            case "father": return `Agregar padre de ${full}`;
            case "mother": return `Agregar madre de ${full}`;
            case "spouse": return `Agregar ${gender === "female" ? "esposa" : "esposo"} de ${full}`;
            case "spouse_another": return `Agregar otra pareja de ${full}`;
            case "son": return `Agregar hijo de ${full}`;
            case "daughter": return `Agregar hija de ${full}`;
            case "brother": return `Agregar hermano de ${full}`;
            case "sister": return `Agregar hermana de ${full}`;
            default: return "Agregar familiar";
        }
    }

    function handleSave() {
        if (!nombre.trim()) return;
        if (saving) return;
        setSaving(true);

        const s1 = surname1.trim() || null;
        const s2 = surname2.trim() || null;
        const sm = surnameMarried.trim() || null;

        const person = {
            name: nombre.trim(),
            surname_1: s1,
            surname_2: s2,
            surname_married: sm,
            surnames: computeSurnames(s1, s2, sm, gender),
            prefix: prefix.trim() || null,
            suffix: suffix.trim() || null,
            gender,
            adopted: false,
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
        };

        const relationship = isSpouse ? {
            type: "spouse",
            marriage_day: marriageDay ? Number(marriageDay) : null,
            marriage_month: marriageMonth ? Number(marriageMonth) : null,
            marriage_year: marriageYear ? Number(marriageYear) : null,
            marriage_place: marriagePlace.trim() || null,
            notes: spouseType !== "married" ? spouseType : null,
        } : isChild ? {
            type: slotType,
            otherParentId: otherParentChoice !== "none" && otherParentChoice !== "new"
                ? otherParentChoice
                : null,
        } : {
            type: slotType,
        };

        onSave({ person, relationship });
    }

    const otherParentLabel = fromPerson?.gender === "male" ? "Madre" : "Padre";

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>

                <div className="modal-header">
                    <h2 className="modal-title">{getTitle()}</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                {/* Género — bloqueado para tipos específicos */}
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
                                disabled={["father", "mother", "son", "daughter", "brother", "sister"].includes(slotType)}
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
                        <label className="modal-label">Primer y segundo nombre</label>
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
                        <label className="modal-label">
                            {isSpouse && gender === "female" ? "Primer apellido (de soltera)" : "Primer apellido"}
                        </label>
                        <input className="form-input" type="text" value={surname1} onChange={(e) => setSurname1(e.target.value)} placeholder="Primer apellido" />
                    </div>
                    <div className="modal-field">
                        <label className="modal-label">
                            {isSpouse && gender === "female" ? "Segundo apellido (de soltera)" : "Segundo apellido"}
                        </label>
                        <input className="form-input" type="text" value={surname2} onChange={(e) => setSurname2(e.target.value)} placeholder="Segundo apellido" />
                    </div>
                </div>
                {isSpouse && gender === "female" && (
                    <div className="modal-field-row">
                        <div className="modal-field modal-field--full">
                            <label className="modal-label">Apellido de casada</label>
                            <input className="form-input" type="text" value={surnameMarried} onChange={(e) => setSurnameMarried(e.target.value)} placeholder="Apellido de casada (opcional)" />
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

                {/* Selector de otro progenitor (solo hijo/hija) */}
                {isChild && (
                    <div className="modal-field-row">
                        <div className="modal-field modal-field--full">
                            <label className="modal-label">{otherParentLabel}</label>
                            <select
                                className="form-select"
                                value={otherParentChoice}
                                onChange={(e) => setOtherParentChoice(e.target.value)}
                            >
                                {otherParent && (
                                    <option value={String(otherParent.id)}>
                                        {otherParent.name} {otherParent.surnames ?? ""}
                                    </option>
                                )}
                                <option value="none">No hay {otherParentLabel.toLowerCase()} (Familia uniparental)</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* Campos de matrimonio (solo spouse) */}
                {isSpouse && (
                    <>
                        <div className="modal-field-row">
                            <div className="modal-field modal-field--full">
                                <label className="modal-label">Relación</label>
                                <select className="form-select" value={spouseType} onChange={(e) => setSpouseType(e.target.value)}>
                                    {SPOUSE_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <DateFields
                            label="Fecha de matrimonio"
                            precision={marriagePrec} onPrecision={setMarriagePrec}
                            day={marriageDay} onDay={setMarriageDay}
                            month={marriageMonth} onMonth={setMarriageMonth}
                            year={marriageYear} onYear={setMarriageYear}
                        />
                        <div className="modal-field-row">
                            <div className="modal-field modal-field--full">
                                <label className="modal-label">Lugar de matrimonio</label>
                                <input className="form-input" type="text" value={marriagePlace} onChange={(e) => setMarriagePlace(e.target.value)} placeholder="Ciudad, País..." />
                            </div>
                        </div>
                    </>
                )}

                {/* Botones */}
                <div className="modal-actions">
                    <div className="modal-actions-right">
                        <button className="btn-secondary" onClick={onClose} disabled={saving}>Cancelar</button>
                        <button className="btn-primary" onClick={handleSave} disabled={saving}>
                            {saving ? "Guardando..." : "OK"}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}