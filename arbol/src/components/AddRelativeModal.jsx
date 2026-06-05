import { useState, useMemo } from "react";

const DATE_PRECISION = ["Exactamente", "Antes de", "Después de", "Alrededor de"];

const SPOUSE_TYPES = [
    { value: "married", label: "Casado/a" },
    { value: "partner", label: "Pareja" },
    { value: "co_parent", label: "Co-padres (sin vínculo formal)" },
    { value: "separated", label: "Separado/a" },
    { value: "divorced", label: "Divorciado/a" },
    { value: "widowed", label: "Viudo/a" },
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

function NewParentForm({ gender, onGenderChange, onData }) {
    const [nombre, setNombre] = useState("");
    const [surname1, setSurname1] = useState("");
    const [surname2, setSurname2] = useState("");

    function handleChange(field, value) {
        const data = {
            nombre: field === "nombre" ? value : nombre,
            surname1: field === "surname1" ? value : surname1,
            surname2: field === "surname2" ? value : surname2,
            gender,
        };
        onData(data);
        if (field === "nombre") setNombre(value);
        if (field === "surname1") setSurname1(value);
        if (field === "surname2") setSurname2(value);
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8, padding: "12px", background: "var(--color-bg-soft)", borderRadius: 8 }}>
            <div className="modal-field-row">
                {[
                    { value: "male", label: "Hombre" },
                    { value: "female", label: "Mujer" },
                    { value: "unknown", label: "Desconocido" },
                ].map((opt) => (
                    <label key={opt.value} className="modal-radio-label">
                        <input type="radio" name="newParentGender" value={opt.value} checked={gender === opt.value} onChange={() => onGenderChange(opt.value)} />
                        {opt.label}
                    </label>
                ))}
            </div>
            <div className="modal-field-row">
                <div className="modal-field">
                    <label className="modal-label">Nombre/s</label>
                    <input className="form-input" type="text" value={nombre} placeholder="Nombre/s" onChange={(e) => handleChange("nombre", e.target.value)} />
                </div>
            </div>
            <div className="modal-field-row">
                <div className="modal-field">
                    <label className="modal-label">Primer apellido</label>
                    <input className="form-input" type="text" value={surname1} placeholder="Primer apellido" onChange={(e) => handleChange("surname1", e.target.value)} />
                </div>
                <div className="modal-field">
                    <label className="modal-label">Segundo apellido</label>
                    <input className="form-input" type="text" value={surname2} placeholder="Segundo apellido" onChange={(e) => handleChange("surname2", e.target.value)} />
                </div>
            </div>
        </div>
    );
}

function PersonSearcher({ candidates, defaultPerson, label, onSelect }) {
    const defaultText = defaultPerson
        ? `${defaultPerson.name} ${defaultPerson.surnames ?? ""}`.trim()
        : "";

    const [query, setQuery] = useState(defaultText);
    const [selected, setSelected] = useState(defaultPerson ?? null);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [filterYear, setFilterYear] = useState("");
    const [filterPlace, setFilterPlace] = useState("");

    const filtered = useMemo(() => {
        if (!query && !filterYear && !filterPlace) return [];
        return candidates.filter((p) => {
            const fullName = `${p.name} ${p.surnames ?? ""}`.toLowerCase();
            const matchName = !query || fullName.includes(query.toLowerCase());
            const matchYear = !filterYear || String(p.birth_year ?? "") === filterYear;
            const matchPlace = !filterPlace || (p.birth_place ?? "").toLowerCase().includes(filterPlace.toLowerCase());
            return matchName && matchYear && matchPlace;
        }).slice(0, 10);
    }, [query, filterYear, filterPlace, candidates]);

    function handleSelect(person) {
        setSelected(person);
        setQuery(`${person.name} ${person.surnames ?? ""}`.trim());
        onSelect(person);
    }

    function handleQueryChange(value) {
        setQuery(value);
        if (selected && `${selected.name} ${selected.surnames ?? ""}`.trim() !== value) {
            setSelected(null);
            onSelect(null);
        }
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label className="modal-label">{label}</label>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input
                    className="form-input"
                    type="text"
                    value={query}
                    onChange={(e) => handleQueryChange(e.target.value)}
                    placeholder="Escribí el nombre para buscar..."
                />
                <button
                    type="button"
                    onClick={() => setShowAdvanced((v) => !v)}
                    style={{
                        flexShrink: 0, width: 34, height: 34,
                        border: "1px solid var(--color-border-medium)",
                        borderRadius: "var(--radius-sm)",
                        background: showAdvanced ? "var(--color-primary-light)" : "white",
                        cursor: "pointer", fontSize: 16,
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                    title="Búsqueda avanzada"
                >
                    🔍
                </button>
            </div>

            {showAdvanced && (
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <div className="modal-field modal-field--sm">
                        <label className="modal-label">Año nac.</label>
                        <input className="form-input" type="number" min="1000" max="2100" placeholder="Año" value={filterYear} onChange={(e) => setFilterYear(e.target.value)} />
                    </div>
                    <div className="modal-field">
                        <label className="modal-label">Lugar nac.</label>
                        <input className="form-input" type="text" placeholder="Ciudad, País..." value={filterPlace} onChange={(e) => setFilterPlace(e.target.value)} />
                    </div>
                </div>
            )}

            {filtered.length > 0 && !selected && (
                <div style={{ border: "1px solid var(--color-border-light)", borderRadius: "var(--radius-md)", background: "white", maxHeight: 180, overflowY: "auto" }}>
                    {filtered.map((p) => (
                        <div
                            key={p.id}
                            onClick={() => handleSelect(p)}
                            style={{ padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid var(--color-border-row)", fontSize: "var(--font-size-md)" }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "var(--color-bg-hover)"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "white"}
                        >
                            <strong>{p.name} {p.surnames ?? ""}</strong>
                            {p.birth_year && <span style={{ color: "var(--color-text-muted)", marginLeft: 8 }}>n. {p.birth_year}</span>}
                            {p.birth_place && <span style={{ color: "var(--color-text-muted)", marginLeft: 8 }}>{p.birth_place}</span>}
                        </div>
                    ))}
                </div>
            )}

            {selected && (
                <div style={{ padding: "6px 10px", background: "var(--color-primary-light)", borderRadius: "var(--radius-sm)", fontSize: "var(--font-size-md)", color: "var(--color-primary-dark)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>✓ {selected.name} {selected.surnames ?? ""}</span>
                    <button onClick={() => { setSelected(null); setQuery(""); onSelect(null); }} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--color-text-muted)", fontSize: 14 }}>✕</button>
                </div>
            )}
        </div>
    );
}

export default function AddRelativeModal({
    slotType,
    fromPerson,
    otherParentOptions = [],
    parentCandidates = [],
    spouseCandidates = [],
    defaultParent = null,
    suggestedSurname1,
    suggestedSurname2,
    onSave,
    onClose,
}) {
    const isSpouse = slotType === "spouse" || slotType === "spouse_another";
    const isChild = slotType === "son" || slotType === "daughter";
    const isParent = slotType === "father" || slotType === "mother";

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

    const defaultOtherParent = otherParentOptions.find((p) => p.isActive) ?? otherParentOptions[0] ?? null;
    const [otherParentChoice, setOtherParentChoice] = useState(
        defaultOtherParent ? String(defaultOtherParent.id) : "none"
    );
    const [newParentGender, setNewParentGender] = useState("male");
    const [newParentData, setNewParentData] = useState(null);

    const [selectedExistingParent, setSelectedExistingParent] = useState(defaultParent ?? null);
    const [showNewForm, setShowNewForm] = useState(false);

    const [selectedExistingSpouse, setSelectedExistingSpouse] = useState(null);
    const [showNewSpouseForm, setShowNewSpouseForm] = useState(false);

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
        if (saving) return;

        // Padre/madre con persona existente
        if (isParent && selectedExistingParent && !showNewForm) {
            setSaving(true);
            onSave({ existingPersonId: selectedExistingParent.id });
            return;
        }
        if (isParent && showNewForm && !nombre.trim()) return;

        // Cónyuge con persona existente
        if (isSpouse && selectedExistingSpouse && !showNewSpouseForm) {
            setSaving(true);
            onSave({
                existingPersonId: selectedExistingSpouse.id,
                relationship: {
                    type: spouseType,
                    marriage_day: marriageDay ? Number(marriageDay) : null,
                    marriage_month: marriageMonth ? Number(marriageMonth) : null,
                    marriage_year: marriageYear ? Number(marriageYear) : null,
                    marriage_place: marriagePlace.trim() || null,
                },
            });
            return;
        }

        if (!isParent && !nombre.trim()) return;

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

        let relationship;
        if (isSpouse) {
            relationship = {
                type: spouseType,
                marriage_day: marriageDay ? Number(marriageDay) : null,
                marriage_month: marriageMonth ? Number(marriageMonth) : null,
                marriage_year: marriageYear ? Number(marriageYear) : null,
                marriage_place: marriagePlace.trim() || null,
            };
        } else if (isChild) {
            if (otherParentChoice === "new" && newParentData?.nombre?.trim()) {
                const np = newParentData;
                const ns1 = np.surname1?.trim() || null;
                const ns2 = np.surname2?.trim() || null;
                relationship = {
                    type: slotType,
                    otherParentNew: {
                        name: np.nombre.trim(),
                        surname_1: ns1,
                        surname_2: ns2,
                        surname_married: null,
                        surnames: computeSurnames(ns1, ns2, null, np.gender),
                        gender: np.gender,
                        adopted: false,
                        is_alive: true,
                    },
                };
            } else {
                relationship = {
                    type: slotType,
                    otherParentId: otherParentChoice !== "none" ? otherParentChoice : null,
                };
            }
        } else {
            relationship = { type: slotType };
        }

        onSave({ person, relationship });
    }

    const otherParentLabel = fromPerson?.gender === "male" ? "Madre" : "Padre";
    const parentLabel = slotType === "father" ? "Padre" : "Madre";
    const spouseLabel = gender === "female" ? "esposa" : "esposo";

    // El label de fecha cambia según el tipo de relación
    const dateLabel = spouseType === "co_parent" ? "Fecha de inicio de convivencia" : "Fecha de matrimonio";
    const placeLabel = spouseType === "co_parent" ? "Lugar de convivencia" : "Lugar de matrimonio";

    const okDisabled = saving
        || (isParent && !selectedExistingParent && !showNewForm)
        || (isSpouse && !selectedExistingSpouse && !showNewSpouseForm);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>

                <div className="modal-header">
                    <h2 className="modal-title">{getTitle()}</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                {/* ── Buscador para padre/madre ── */}
                {isParent && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <PersonSearcher
                            candidates={parentCandidates}
                            defaultPerson={defaultParent}
                            label={`Buscar ${parentLabel.toLowerCase()} existente`}
                            onSelect={setSelectedExistingParent}
                        />
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ flex: 1, height: 1, background: "var(--color-border-light)" }} />
                            <span style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>o</span>
                            <div style={{ flex: 1, height: 1, background: "var(--color-border-light)" }} />
                        </div>
                        <button
                            className={showNewForm ? "btn-secondary" : "btn-primary"}
                            onClick={() => { setShowNewForm((v) => !v); setSelectedExistingParent(null); }}
                            style={{ alignSelf: "flex-start" }}
                        >
                            {showNewForm ? "Cancelar nueva persona" : `➕ Crear nuevo/a ${parentLabel.toLowerCase()}`}
                        </button>
                    </div>
                )}

                {/* ── Buscador para cónyuge ── */}
                {isSpouse && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <PersonSearcher
                            candidates={spouseCandidates}
                            defaultPerson={null}
                            label={`Buscar pareja existente`}
                            onSelect={setSelectedExistingSpouse}
                        />
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ flex: 1, height: 1, background: "var(--color-border-light)" }} />
                            <span style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>o</span>
                            <div style={{ flex: 1, height: 1, background: "var(--color-border-light)" }} />
                        </div>
                        <button
                            className={showNewSpouseForm ? "btn-secondary" : "btn-primary"}
                            onClick={() => { setShowNewSpouseForm((v) => !v); setSelectedExistingSpouse(null); }}
                            style={{ alignSelf: "flex-start" }}
                        >
                            {showNewSpouseForm ? "Cancelar nueva persona" : `➕ Crear nueva pareja`}
                        </button>
                    </div>
                )}

                {/* ── Formulario de nueva persona ── */}
                {(!isParent && !isSpouse) || (isParent && showNewForm) || (isSpouse && showNewSpouseForm) ? (
                    <>
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

                        <DateFields
                            label="Fecha de nacimiento"
                            precision={birthPrec} onPrecision={setBirthPrec}
                            day={birthDay} onDay={setBirthDay}
                            month={birthMonth} onMonth={setBirthMonth}
                            year={birthYear} onYear={setBirthYear}
                        />

                        <div className="modal-field-row">
                            <div className="modal-field modal-field--full">
                                <label className="modal-label">Lugar de nacimiento</label>
                                <input className="form-input" type="text" value={birthPlace} onChange={(e) => setBirthPlace(e.target.value)} placeholder="Ciudad, País..." />
                            </div>
                        </div>

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

                        {isChild && (
                            <div className="modal-field-row">
                                <div className="modal-field modal-field--full">
                                    <label className="modal-label">{otherParentLabel}</label>
                                    <select
                                        className="form-select"
                                        value={otherParentChoice}
                                        onChange={(e) => setOtherParentChoice(e.target.value)}
                                    >
                                        {otherParentOptions.map((p) => (
                                            <option key={p.id} value={String(p.id)}>
                                                {p.name} {p.surnames ?? ""}
                                                {p.isActive ? " (pareja actual)" : " (pareja anterior)"}
                                            </option>
                                        ))}
                                        <option value="new">➕ Crear nuevo/a {otherParentLabel.toLowerCase()}</option>
                                        <option value="none">Sin {otherParentLabel.toLowerCase()} conocido/a</option>
                                    </select>
                                    {otherParentChoice === "new" && (
                                        <NewParentForm
                                            gender={newParentGender}
                                            onGenderChange={(g) => {
                                                setNewParentGender(g);
                                                setNewParentData((prev) => ({ ...prev, gender: g }));
                                            }}
                                            onData={setNewParentData}
                                        />
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                ) : null}

                {/* Tipo de relación y fechas — visible cuando hay persona seleccionada o formulario abierto */}
                {isSpouse && (selectedExistingSpouse || showNewSpouseForm) && (
                    <>
                        <div className="modal-field-row">
                            <div className="modal-field modal-field--full">
                                <label className="modal-label">Tipo de relación</label>
                                <select className="form-select" value={spouseType} onChange={(e) => setSpouseType(e.target.value)}>
                                    {SPOUSE_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        {spouseType !== "co_parent" && (
                            <>
                                <DateFields
                                    label={dateLabel}
                                    precision={marriagePrec} onPrecision={setMarriagePrec}
                                    day={marriageDay} onDay={setMarriageDay}
                                    month={marriageMonth} onMonth={setMarriageMonth}
                                    year={marriageYear} onYear={setMarriageYear}
                                />
                                <div className="modal-field-row">
                                    <div className="modal-field modal-field--full">
                                        <label className="modal-label">{placeLabel}</label>
                                        <input className="form-input" type="text" value={marriagePlace} onChange={(e) => setMarriagePlace(e.target.value)} placeholder="Ciudad, País..." />
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}

                <div className="modal-actions">
                    <div className="modal-actions-right">
                        <button className="btn-secondary" onClick={onClose} disabled={saving}>Cancelar</button>
                        <button className="btn-primary" onClick={handleSave} disabled={okDisabled}>
                            {saving ? "Guardando..." : "OK"}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}