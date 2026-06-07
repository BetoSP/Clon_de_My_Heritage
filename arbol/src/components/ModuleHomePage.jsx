import { useState } from "react";
import { computeDisplaySurnames } from "../utils/personUtils.js";

const MONTH_NAMES_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function getUpcomingBirthdays(people, daysAhead = 30) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const future = new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  return people
    .filter(p => p.is_alive !== false && p.birth_month && p.birth_day)
    .map(p => {
      const bday = new Date(today.getFullYear(), p.birth_month - 1, p.birth_day);
      if (bday < today) bday.setFullYear(today.getFullYear() + 1);
      return { person: p, date: bday };
    })
    .filter(({ date }) => date <= future)
    .sort((a, b) => a.date - b.date);
}

// ── Props ──────────────────────────────────────────────────────────────────────
// activeTree      { name, ownerName }   — árbol activo
// onTreeNameChange fn(name)             — callback para guardar nuevo nombre
// people          Array                 — lista de personas del árbol
// onNavigate      fn(sectionId)         — para navegar a otras secciones
export default function ModuleHomePage({ activeTree, onTreeNameChange, people = [], onNavigate }) {
  const [bannerVisible, setBannerVisible] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(activeTree?.name ?? "Mi árbol familiar");

  const birthdays = getUpcomingBirthdays(people);
  const recentPeople = [...people].sort((a, b) => Number(b.id) - Number(a.id)).slice(0, 5);

  function handleNameSubmit() {
    const trimmed = nameInput.trim();
    if (trimmed) onTreeNameChange?.(trimmed);
    setEditingName(false);
  }

  function handleNameKeyDown(e) {
    if (e.key === "Enter") handleNameSubmit();
    if (e.key === "Escape") {
      setNameInput(activeTree?.name ?? "");
      setEditingName(false);
    }
  }

  return (
    <div className="home-page">

      {/* ── Banner ──────────────────────────────────────────────────────── */}
      {bannerVisible && (
        <div className="home-banner">
          <span className="home-banner__text">
            Espacio reservado para banner — se colapsa si no hay contenido
          </span>
          <button className="home-banner__close" onClick={() => setBannerVisible(false)} title="Cerrar banner">
            ✕
          </button>
        </div>
      )}

      {/* ── Contenido principal ─────────────────────────────────────────── */}
      <div className="home-content">

        {/* ── Cabecera del árbol ──────────────────────────────────────── */}
        <div className="home-section home-section--header">
          <div className="home-tree-header">

            <div className="home-tree-header__info">
              {editingName ? (
                <input
                  className="home-tree-name-input"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  onBlur={handleNameSubmit}
                  onKeyDown={handleNameKeyDown}
                  autoFocus
                  maxLength={80}
                />
              ) : (
                <h1
                  className="home-tree-name"
                  onClick={() => { setEditingName(true); setNameInput(activeTree?.name ?? ""); }}
                  title="Clic para editar el nombre del árbol"
                >
                  {activeTree?.name ?? "Mi árbol familiar"}
                  <span className="home-tree-name__edit-hint">✎</span>
                </h1>
              )}
              <p className="home-tree-owner">
                {activeTree?.ownerName ?? "Usuario"}
                <span className="home-tree-role"> · Creador del sitio</span>
              </p>
            </div>

            <div className="home-stats">
              <div className="home-stats__item">
                <span className="home-stats__value">{people.length}</span>
                <span className="home-stats__label">personas</span>
              </div>
              <div className="home-stats__item">
                <span className="home-stats__value">0</span>
                <span className="home-stats__label">fotos</span>
              </div>
            </div>

            <button className="btn-primary home-tree-header__cta" onClick={() => onNavigate?.("tree")}>
              Ver árbol
            </button>

          </div>
        </div>

        {/* ── Próximos eventos ──────────────────────────────────────────── */}
        <div className="home-section">
          <h2 className="home-section__title">Próximos eventos familiares</h2>
          {birthdays.length === 0 ? (
            <p className="home-empty-msg">No hay cumpleaños en los próximos 30 días.</p>
          ) : (
            <ul className="home-events">
              {birthdays.map(({ person, date }) => {
                const fullName = [person.name, computeDisplaySurnames(person)].filter(Boolean).join(" ");
                const dateStr = `${date.getDate()} de ${MONTH_NAMES_ES[date.getMonth()]}`;
                const age = person.birth_year ? date.getFullYear() - person.birth_year : null;
                return (
                  <li key={person.id} className="home-events__item">
                    <span className="home-events__icon">🎂</span>
                    <span className="home-events__text">
                      Cumpleaños de <strong>{fullName}</strong>
                      {age !== null && age > 0 && ` — ${age} años`}
                    </span>
                    <span className="home-events__date">{dateStr}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ── Actividad reciente ────────────────────────────────────────── */}
        <div className="home-section">
          <h2 className="home-section__title">Últimas personas agregadas</h2>
          {recentPeople.length === 0 ? (
            <p className="home-empty-msg">No hay personas registradas todavía.</p>
          ) : (
            <ul className="home-events">
              {recentPeople.map(person => {
                const fullName = [person.name, computeDisplaySurnames(person)].filter(Boolean).join(" ");
                const born = person.birth_year ? ` (${person.birth_year})` : "";
                return (
                  <li key={person.id} className="home-events__item">
                    <span className="home-events__icon">👤</span>
                    <span className="home-events__text">
                      <strong>{fullName}</strong>{born} agregado al árbol
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
}
