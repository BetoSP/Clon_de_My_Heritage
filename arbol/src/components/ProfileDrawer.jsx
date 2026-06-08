import { useState, useEffect, useMemo, useRef } from "react";
import { COUPLE_TYPES, PARENT_TYPES } from "../graph/relationshipTypes.js";
import { updatePerson } from "../services/peopleService.js";
import "./ProfileDrawer.css";

// ── Constantes de etiquetas ──────────────────────────────────────────────────

const COUPLE_LABELS = {
  married: "Casados",
  partner: "Pareja de hecho",
  co_parent: "Co-progenitores",
  separated: "Separados",
  divorced: "Divorciados",
  widowed: "Viudo/a",
  unknown: "Relación desconocida",
};

const PARENT_LABELS = {
  father: "Su padre",
  mother: "Su madre",
  adoptive_father: "Su padre adoptivo",
  adoptive_mother: "Su madre adoptiva",
  stepfather: "Su padrastro",
  stepmother: "Su madrastra",
  foster_father: "Su padre de acogida",
  foster_mother: "Su madre de acogida",
};

const MONTHS_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

// ── Funciones auxiliares ─────────────────────────────────────────────────────

function formatDate(day, month, year) {
  if (!year) return "—";
  if (!month) return String(year);
  if (!day) return `${MONTHS_ES[month - 1]} de ${year}`;
  return `${day} de ${MONTHS_ES[month - 1]} de ${year}`;
}

function getFullName(person) {
  if (!person) return "—";
  const parts = [person.prefix, person.name, person.name_2, person.surname_1, person.surname_2].filter(Boolean);
  return parts.join(" ") || "—";
}

function computeAge(person) {
  if (!person.birth_year) return null;
  if (person.is_alive === false) {
    return person.death_year ? person.death_year - person.birth_year : null;
  }
  return 2026 - person.birth_year;
}

function getLifeYears(person) {
  if (!person) return "";
  if (person.birth_year && person.is_alive === false && person.death_year) {
    return `${person.birth_year} – ${person.death_year}`;
  }
  if (person.birth_year) return String(person.birth_year);
  return "";
}

// ── Sub-componentes ──────────────────────────────────────────────────────────

function PersonAvatarHTML({ person, size = 36 }) {
  const isMale = person?.gender === "male";
  const isFemale = person?.gender === "female";
  const bgColor = isMale
    ? "var(--node-male-bg)"
    : isFemale
    ? "var(--node-female-bg)"
    : "var(--avatar-bg)";
  const iconColor = isMale
    ? "var(--node-gender-bar-male)"
    : isFemale
    ? "var(--node-gender-bar-female)"
    : "var(--avatar-fill)";

  return (
    <div className="profile-avatar" style={{ width: size, height: size, background: bgColor }}>
      <svg viewBox="0 0 40 40" width={size * 0.65} height={size * 0.65} fill={iconColor}>
        <circle cx="20" cy="14" r="8" />
        <ellipse cx="20" cy="36" rx="13" ry="9" />
      </svg>
    </div>
  );
}

// Edición inline de un campo de texto
function InlineText({ value, onSave, placeholder = "—" }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value ?? "");

  useEffect(() => {
    if (!editing) setVal(value ?? "");
  }, [value, editing]);

  async function save() {
    const trimmed = val.trim();
    setEditing(false);
    if (trimmed === (value ?? "")) return;
    await onSave(trimmed || null);
  }

  if (editing) {
    return (
      <input
        className="profile-inline-input"
        value={val}
        autoFocus
        onChange={(e) => setVal(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") { setVal(value ?? ""); setEditing(false); }
        }}
      />
    );
  }

  return (
    <span className="profile-inline-value" onClick={() => setEditing(true)} title="Click para editar">
      {value
        ? value
        : <span className="profile-inline-empty">{placeholder}</span>
      }
    </span>
  );
}

// Edición inline de fecha (día + mes + año)
function InlineDate({ day, month, year, onSave }) {
  const [editing, setEditing] = useState(false);
  const [d, setD] = useState(day ?? "");
  const [m, setM] = useState(month ?? "");
  const [y, setY] = useState(year ?? "");

  useEffect(() => {
    if (!editing) {
      setD(day ?? "");
      setM(month ?? "");
      setY(year ?? "");
    }
  }, [day, month, year, editing]);

  function save() {
    setEditing(false);
    onSave({
      day: d !== "" ? Number(d) : null,
      month: m !== "" ? Number(m) : null,
      year: y !== "" ? Number(y) : null,
    });
  }

  function cancel() {
    setD(day ?? "");
    setM(month ?? "");
    setY(year ?? "");
    setEditing(false);
  }

  const formatted = formatDate(day, month, year);

  if (!editing) {
    return (
      <span className="profile-inline-value" onClick={() => setEditing(true)} title="Click para editar">
        {formatted !== "—"
          ? formatted
          : <span className="profile-inline-empty">—</span>
        }
      </span>
    );
  }

  return (
    <span className="profile-inline-date">
      <input type="number" className="profile-inline-input profile-inline-input--sm"
        placeholder="Día" value={d} onChange={(e) => setD(e.target.value)} min={1} max={31} />
      <input type="number" className="profile-inline-input profile-inline-input--sm"
        placeholder="Mes" value={m} onChange={(e) => setM(e.target.value)} min={1} max={12} />
      <input type="number" className="profile-inline-input profile-inline-input--md"
        placeholder="Año" value={y} onChange={(e) => setY(e.target.value)} min={1} max={2100} />
      <button className="profile-inline-save" onClick={save}>✓</button>
      <button className="profile-inline-cancel" onClick={cancel}>✕</button>
    </span>
  );
}

// Sección acordeón
function ProfileSection({ title, open, onToggle, addLabel, children }) {
  return (
    <div className="profile-section">
      <div className="profile-section__header" onClick={onToggle}>
        <span className="profile-section__title">{title}</span>
        <span className="profile-section__header-right">
          {addLabel && (
            <button className="profile-section__add-btn" onClick={(e) => e.stopPropagation()}>
              + {addLabel}
            </button>
          )}
          <span className={`profile-section__chevron${open ? " profile-section__chevron--open" : ""}`}>
            ▼
          </span>
        </span>
      </div>
      {open && <div className="profile-section__body">{children}</div>}
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────

export default function ProfileDrawer({
  personId,
  people,
  relationships,
  onClose,
  onFocusPerson,
  onEditPerson,
  onNavigateToPerson,
  onDissolveSpouse,
  onDeletePerson,
  onDeleteRelationship,
  loadData,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sections, setSections] = useState({ bio: true, family: true, events: false, sources: false });
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [dissolvingRelId, setDissolvingRelId] = useState(null);
  const [dissolveYearVal, setDissolveYearVal] = useState("");
  const [deletingRelId, setDeletingRelId] = useState(null);
  const [inlineError, setInlineError] = useState(null);
  const moreMenuRef = useRef(null);

  const personFromProps = useMemo(
    () => people.find((p) => String(p.id) === String(personId)) ?? null,
    [people, personId]
  );
  const [localPerson, setLocalPerson] = useState(personFromProps);

  // Sincronizar localPerson cuando los datos de DB se actualizan
  useEffect(() => {
    setLocalPerson(personFromProps);
  }, [personFromProps]);

  // Animación de apertura al montar
  useEffect(() => {
    const frame = requestAnimationFrame(() => setDrawerOpen(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Resetear estado al navegar a otra persona
  useEffect(() => {
    setShowMoreMenu(false);
    setDissolvingRelId(null);
    setDissolveYearVal("");
    setDeletingRelId(null);
    setConfirmDelete(false);
    setInlineError(null);
  }, [personId]);

  // Cerrar menú "Más" al hacer click fuera
  useEffect(() => {
    if (!showMoreMenu) return;
    function handleOutsideClick(e) {
      if (!moreMenuRef.current?.contains(e.target)) setShowMoreMenu(false);
    }
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, [showMoreMenu]);

  // ── Derivación de familia (desde memoria, sin queries) ──────────────────

  const parents = useMemo(() => {
    if (!personId) return [];
    return relationships
      .filter((r) => PARENT_TYPES.has(r.type) && String(r.person_b_id) === String(personId))
      .map((r) => ({ rel: r, person: people.find((p) => String(p.id) === String(r.person_a_id)) }))
      .filter((x) => x.person);
  }, [relationships, people, personId]);

  const children = useMemo(() => {
    if (!personId) return [];
    return relationships
      .filter((r) => PARENT_TYPES.has(r.type) && String(r.person_a_id) === String(personId))
      .map((r) => ({ rel: r, person: people.find((p) => String(p.id) === String(r.person_b_id)) }))
      .filter((x) => x.person);
  }, [relationships, people, personId]);

  const spouses = useMemo(() => {
    if (!personId) return [];
    return relationships
      .filter(
        (r) =>
          COUPLE_TYPES.has(r.type) &&
          (String(r.person_a_id) === String(personId) || String(r.person_b_id) === String(personId))
      )
      .map((r) => {
        const spouseId =
          String(r.person_a_id) === String(personId) ? r.person_b_id : r.person_a_id;
        return { rel: r, person: people.find((p) => String(p.id) === String(spouseId)) };
      })
      .filter((x) => x.person);
  }, [relationships, people, personId]);

  const siblings = useMemo(() => {
    const siblingIds = new Set();
    parents.forEach(({ rel }) => {
      relationships
        .filter(
          (r) =>
            PARENT_TYPES.has(r.type) &&
            String(r.person_a_id) === String(rel.person_a_id) &&
            String(r.person_b_id) !== String(personId)
        )
        .forEach((r) => siblingIds.add(String(r.person_b_id)));
    });
    return [...siblingIds]
      .map((id) => people.find((p) => String(p.id) === id))
      .filter(Boolean);
  }, [parents, relationships, personId, people]);

  // ── Lista de eventos ────────────────────────────────────────────────────

  const events = useMemo(() => {
    if (!localPerson) return [];
    const list = [];

    if (localPerson.birth_year) {
      list.push({
        year: localPerson.birth_year,
        type: "Nacimiento",
        detail: formatDate(localPerson.birth_day, localPerson.birth_month, localPerson.birth_year),
        place: localPerson.birth_place,
        personRef: null,
      });
    }

    spouses.forEach(({ rel, person: spouse }) => {
      if (rel.marriage_year) {
        list.push({
          year: rel.marriage_year,
          type: "Matrimonio con:",
          detail: formatDate(rel.marriage_day, rel.marriage_month, rel.marriage_year),
          place: rel.marriage_place,
          personRef: spouse,
        });
      }
    });

    if (localPerson.is_alive === false && localPerson.death_year) {
      list.push({
        year: localPerson.death_year,
        type: "Fallecimiento",
        detail: formatDate(localPerson.death_day, localPerson.death_month, localPerson.death_year),
        place: localPerson.death_place,
        personRef: null,
      });
    }

    return list.sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999));
  }, [localPerson, spouses]);

  // ── Edición inline ──────────────────────────────────────────────────────

  async function handleInlinePatch(field, value) {
    if (!localPerson) return;
    const prev = localPerson;
    setInlineError(null);
    setLocalPerson((p) => ({ ...p, [field]: value }));
    try {
      await updatePerson({ ...prev, id: prev.id, [field]: value });
      loadData();
    } catch {
      setLocalPerson(prev);
      setInlineError("Error al guardar. Intentá de nuevo.");
    }
  }

  async function handleInlineDatePatch(prefix, { day, month, year }) {
    if (!localPerson) return;
    const prev = localPerson;
    setInlineError(null);
    setLocalPerson((p) => ({
      ...p,
      [`${prefix}_day`]: day,
      [`${prefix}_month`]: month,
      [`${prefix}_year`]: year,
    }));
    try {
      await updatePerson({
        ...prev,
        id: prev.id,
        [`${prefix}_day`]: day,
        [`${prefix}_month`]: month,
        [`${prefix}_year`]: year,
      });
      loadData();
    } catch {
      setLocalPerson(prev);
      setInlineError("Error al guardar. Intentá de nuevo.");
    }
  }

  // ── Handlers ────────────────────────────────────────────────────────────

  function handleDissolveConfirm(relId) {
    if (!dissolveYearVal) return;
    onDissolveSpouse(relId, Number(dissolveYearVal));
    setDissolvingRelId(null);
    setDissolveYearVal("");
  }

  async function handleDeleteRelConfirm(relId) {
    setDeletingRelId(null);
    await onDeleteRelationship(relId);
  }

  function handleMoreMenuDeleteClick() {
    setShowMoreMenu(false);
    setConfirmDelete(true);
  }

  function handleDeleteConfirmed() {
    onDeletePerson(personId);
    onClose();
  }

  function handleFocusAndClose() {
    onFocusPerson(personId);
    setShowMoreMenu(false);
    onClose();
  }

  function handleOpenDissolveFromMenu() {
    const firstActive = spouses.find((s) => s.rel.until_year == null);
    if (firstActive) {
      setDissolvingRelId(firstActive.rel.id);
      setSections((s) => ({ ...s, family: true }));
    }
    setShowMoreMenu(false);
  }

  // ── Guard ────────────────────────────────────────────────────────────────

  if (!localPerson) return null;

  const age = computeAge(localPerson);
  const isDeceased = localPerson.is_alive === false;
  const fullName = getFullName(localPerson);
  const vitalsDate = formatDate(
    localPerson.birth_day,
    localPerson.birth_month,
    localPerson.birth_year
  );
  const hasVitals = localPerson.birth_year || localPerson.birth_place;

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <div className="profile-drawer-backdrop" />

      {/* Botón de cierre — fuera del drawer para que position:fixed no quede cortado por overflow */}
      <button
        className="profile-drawer__close-btn"
        onClick={drawerOpen ? onClose : undefined}
        title={drawerOpen ? "Cerrar panel" : ""}
        style={{ left: drawerOpen ? 420 : -32 }}
      >
        {drawerOpen ? "‹" : "›"}
      </button>

      <div className={`profile-drawer${drawerOpen ? " profile-drawer--open" : ""}`}>

        {/* ── SECCIÓN 1: Encabezado ─────────────────────────────────────── */}
        <div className="profile-header">
          <div className="profile-header__row">
            <PersonAvatarHTML person={localPerson} size={72} />
            <div className="profile-header__info">
              <div className="profile-header__name">{fullName}</div>
              <div className="profile-header__subtitle">Este es usted</div>
              {hasVitals && (
                <div className="profile-header__vitals">
                  {localPerson.birth_year && (
                    <>
                      <span className="vital-symbol">* </span>
                      {vitalsDate !== "—" ? vitalsDate : localPerson.birth_year}
                      {age !== null && ` (${age} años)`}
                    </>
                  )}
                  {localPerson.birth_year && localPerson.birth_place && " · "}
                  {localPerson.birth_place}
                </div>
              )}
              <button className="profile-header__link">Investigar a esta persona ›</button>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="profile-actions">
            <button className="profile-action-btn" data-tooltip="Ver el perfil completo">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="3" width="18" height="18" rx="3"/>
                <circle cx="12" cy="10" r="3"/>
                <path d="M6 21c0-3.314 2.686-5 6-5s6 1.686 6 5"/>
              </svg>
              <span>Perfil</span>
            </button>
            <button
              className="profile-action-btn"
              data-tooltip="Edición rápida"
              onClick={() => onEditPerson(personId)}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              <span>Editar</span>
            </button>
            <button className="profile-action-btn" data-tooltip="Añadir familiares">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <line x1="19" y1="8" x2="19" y2="14"/>
                <line x1="16" y1="11" x2="22" y2="11"/>
              </svg>
              <span>Agregar</span>
            </button>
            <div className="profile-more-menu-wrap" ref={moreMenuRef}>
              <button
                className="profile-action-btn"
                data-tooltip="Más opciones"
                onClick={(e) => { e.stopPropagation(); setShowMoreMenu((v) => !v); }}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <circle cx="5" cy="12" r="2"/>
                  <circle cx="12" cy="12" r="2"/>
                  <circle cx="19" cy="12" r="2"/>
                </svg>
                <span>Más</span>
              </button>
              {showMoreMenu && (
                <div className="profile-more-menu">
                  <button className="profile-more-menu__item" onClick={handleFocusAndClose}>
                    Ver su árbol
                  </button>
                  <button className="profile-more-menu__item">Editar foto</button>
                  <button className="profile-more-menu__item">
                    Conectar con una persona del árbol
                  </button>
                  <button className="profile-more-menu__item" onClick={handleOpenDissolveFromMenu}>
                    Eliminar conexión
                  </button>
                  <button className="profile-more-menu__item">Editar padres</button>
                  <div className="profile-more-menu__separator" />
                  <button
                    className="profile-more-menu__item profile-more-menu__item--danger"
                    onClick={handleMoreMenuDeleteClick}
                  >
                    Borrar a esta persona
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Confirmación de eliminación */}
        {confirmDelete && (
          <div className="profile-delete-confirm">
            <span>¿Eliminar a {localPerson.name}?</span>
            <button className="btn-confirm-yes" onClick={handleDeleteConfirmed}>Sí, eliminar</button>
            <button className="btn-confirm-no" onClick={() => setConfirmDelete(false)}>Cancelar</button>
          </div>
        )}

        {/* ── SECCIÓN 3: Descubrimientos ───────────────────────────────── */}
        <div className="profile-section">
          <div className="profile-section__header" style={{ cursor: "default" }}>
            <span className="profile-section__title">Descubrimientos</span>
          </div>
          <div className="profile-placeholder">
            <span className="profile-placeholder__icon">✓</span>
            <span>Sin coincidencias por ahora</span>
          </div>
        </div>

        {/* ── SECCIÓN 4: Fotos y Videos ────────────────────────────────── */}
        <div className="profile-section">
          <div className="profile-section__header" style={{ cursor: "default" }}>
            <span className="profile-section__title">Fotos y Videos</span>
            <span className="profile-section__header-right">
              <button className="profile-section__add-btn">+ Agregar</button>
            </span>
          </div>
          <div className="profile-placeholder">
            <span className="profile-placeholder__icon">🖼</span>
            <span>Sin fotos</span>
          </div>
        </div>

        {/* ── SECCIÓN 5: Biografía ─────────────────────────────────────── */}
        <ProfileSection
          title="Biografía"
          open={sections.bio}
          onToggle={() => setSections((s) => ({ ...s, bio: !s.bio }))}
          addLabel="Agregar"
        >
          {/* Nacimiento */}
          <div className="profile-bio-field">
            <span className="profile-bio-label">Nacimiento</span>
            <InlineDate
              day={localPerson.birth_day}
              month={localPerson.birth_month}
              year={localPerson.birth_year}
              onSave={(vals) => handleInlineDatePatch("birth", vals)}
            />
            <InlineText
              value={localPerson.birth_place}
              onSave={(val) => handleInlinePatch("birth_place", val)}
              placeholder="Lugar de nacimiento"
            />
          </div>

          {/* Fallecimiento */}
          {isDeceased && (
            <div className="profile-bio-field">
              <span className="profile-bio-label">Fallecimiento</span>
              <InlineDate
                day={localPerson.death_day}
                month={localPerson.death_month}
                year={localPerson.death_year}
                onSave={(vals) => handleInlineDatePatch("death", vals)}
              />
              <InlineText
                value={localPerson.death_place}
                onSave={(val) => handleInlinePatch("death_place", val)}
                placeholder="Lugar de fallecimiento"
              />
              <InlineText
                value={localPerson.death_cause}
                onSave={(val) => handleInlinePatch("death_cause", val)}
                placeholder="Causa de fallecimiento"
              />
            </div>
          )}

          {/* Sepultura */}
          {localPerson.burial_place != null && (
            <div className="profile-bio-field">
              <span className="profile-bio-label">Sepultura</span>
              <InlineText
                value={localPerson.burial_place}
                onSave={(val) => handleInlinePatch("burial_place", val)}
                placeholder="Lugar de sepultura"
              />
            </div>
          )}

          {inlineError && <div className="profile-inline-error">{inlineError}</div>}
        </ProfileSection>

        {/* ── SECCIÓN 6: Familia Inmediata ──────────────────────────────── */}
        <ProfileSection
          title="Familia Inmediata"
          open={sections.family}
          onToggle={() => setSections((s) => ({ ...s, family: !s.family }))}
          addLabel="Agregar"
        >
          {/* Padres */}
          {parents.length > 0 && (
            <div className="profile-family-group">
              <div className="profile-family-group__label">Padres</div>
              {parents.map(({ rel, person: p }) => (
                <div key={rel.id}>
                  <div className="profile-family-member" onClick={() => onNavigateToPerson(p.id)}>
                    <PersonAvatarHTML person={p} size={36} />
                    <div className="profile-family-member__info">
                      <div className="profile-family-member__name">{getFullName(p)}</div>
                      <div className="profile-family-member__rel">
                        {PARENT_LABELS[rel.type] ?? rel.type}
                        {getLifeYears(p) && (
                          <span className="profile-family-member__years"> · {getLifeYears(p)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Cónyuge / Pareja */}
          {spouses.length > 0 && (
            <div className="profile-family-group">
              <div className="profile-family-group__label">Cónyuge / Pareja</div>
              {spouses.map(({ rel, person: p }) => (
                <div key={rel.id}>
                  <div className="profile-family-member" onClick={() => onNavigateToPerson(p.id)}>
                    <PersonAvatarHTML person={p} size={36} />
                    <div className="profile-family-member__info">
                      <div className="profile-family-member__name">{getFullName(p)}</div>
                      <div className="profile-family-member__rel">
                        {COUPLE_LABELS[rel.type] ?? rel.type}
                        {rel.marriage_year && ` desde ${rel.marriage_year}`}
                        {rel.until_year && ` hasta ${rel.until_year}`}
                      </div>
                    </div>
                    {rel.until_year == null && (
                      <div style={{ display: "flex", gap: "var(--spacing-1)" }}>
                        <button
                          className="profile-dissolve-trigger"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDissolvingRelId((prev) => (prev === rel.id ? null : rel.id));
                            setDissolveYearVal("");
                            setDeletingRelId(null);
                          }}
                        >
                          Disolver
                        </button>
                        <button
                          className="profile-delete-rel-trigger"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingRelId((prev) => (prev === rel.id ? null : rel.id));
                            setDissolvingRelId(null);
                          }}
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                  {dissolvingRelId === rel.id && (
                    <div className="profile-dissolve-inline">
                      <input
                        type="number"
                        className="profile-dissolve-input"
                        placeholder="Año"
                        value={dissolveYearVal}
                        onChange={(e) => setDissolveYearVal(e.target.value)}
                        autoFocus
                        min={1}
                        max={2100}
                      />
                      <button
                        className="profile-inline-save"
                        onClick={() => handleDissolveConfirm(rel.id)}
                      >
                        ✓
                      </button>
                      <button
                        className="profile-inline-cancel"
                        onClick={() => { setDissolvingRelId(null); setDissolveYearVal(""); }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  {deletingRelId === rel.id && (
                    <div className="profile-delete-rel-confirm">
                      <p className="profile-delete-rel-warning">
                        Solo usá esta opción si cargaste la relación por error.
                        Si la relación realmente existió pero terminó, usá "Disolver" en su lugar.
                        Esta acción no se puede deshacer.
                      </p>
                      <div className="profile-delete-rel-actions">
                        <button
                          className="btn-confirm-yes"
                          onClick={() => handleDeleteRelConfirm(rel.id)}
                        >
                          Sí, eliminar relación
                        </button>
                        <button
                          className="btn-confirm-no"
                          onClick={() => setDeletingRelId(null)}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Hijos */}
          {children.length > 0 && (
            <div className="profile-family-group">
              <div className="profile-family-group__label">Hijos</div>
              {children.map(({ rel, person: p }) => (
                <div
                  key={rel.id}
                  className="profile-family-member"
                  onClick={() => onNavigateToPerson(p.id)}
                >
                  <PersonAvatarHTML person={p} size={36} />
                  <div className="profile-family-member__info">
                    <div className="profile-family-member__name">{getFullName(p)}</div>
                    <div className="profile-family-member__rel">
                      {p.gender === "female" ? "Su hija" : "Su hijo"}
                      {getLifeYears(p) && (
                        <span className="profile-family-member__years"> · {getLifeYears(p)}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Hermanos */}
          {siblings.length > 0 && (
            <div className="profile-family-group">
              <div className="profile-family-group__label">Hermanos</div>
              {siblings.map((p) => (
                <div
                  key={p.id}
                  className="profile-family-member"
                  onClick={() => onNavigateToPerson(p.id)}
                >
                  <PersonAvatarHTML person={p} size={36} />
                  <div className="profile-family-member__info">
                    <div className="profile-family-member__name">{getFullName(p)}</div>
                    <div className="profile-family-member__rel">
                      {p.gender === "female" ? "Su hermana" : "Su hermano"}
                      {getLifeYears(p) && (
                        <span className="profile-family-member__years"> · {getLifeYears(p)}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {parents.length === 0 &&
            spouses.length === 0 &&
            children.length === 0 &&
            siblings.length === 0 && (
              <p className="profile-empty-msg">Sin familia registrada</p>
            )}
        </ProfileSection>

        {/* ── SECCIÓN 7: Eventos ───────────────────────────────────────── */}
        <ProfileSection
          title="Eventos"
          open={sections.events}
          onToggle={() => setSections((s) => ({ ...s, events: !s.events }))}
          addLabel="Agregar"
        >
          {events.length === 0 ? (
            <p className="profile-empty-msg">Sin eventos registrados</p>
          ) : (
            events.map((ev, i) => (
              <div key={i} className="profile-event">
                <div className="profile-event__year">{ev.year}</div>
                <div className="profile-event__body">
                  <div className="profile-event__type">{ev.type}</div>
                  {ev.detail && ev.detail !== "—" && (
                    <div className="profile-event__detail">{ev.detail}</div>
                  )}
                  {ev.place && <div className="profile-event__place">{ev.place}</div>}
                  {ev.personRef && (
                    <div
                      className="profile-event__person-ref"
                      onClick={() => onNavigateToPerson(ev.personRef.id)}
                    >
                      <PersonAvatarHTML person={ev.personRef} size={24} />
                      <span className="profile-event__person-name">{getFullName(ev.personRef)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </ProfileSection>

        {/* ── SECCIÓN 8: Fuentes ───────────────────────────────────────── */}
        <ProfileSection
          title="Fuentes"
          open={sections.sources}
          onToggle={() => setSections((s) => ({ ...s, sources: !s.sources }))}
          addLabel="Agregar"
        >
          <p className="profile-empty-msg">Sin fuentes registradas</p>
        </ProfileSection>

      </div>
    </>
  );
}
