// ── Icons ──────────────────────────────────────────────────────────────────
function IconCart() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="icon-sm">
      <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3z" />
      <path d="M16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
    </svg>
  );
}

function IconHelp() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="icon-sm">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM9 9a1 1 0 112 0v.5a.5.5 0 01-.5.5H10a1 1 0 110 2h.5a.5.5 0 01.5.5V13a1 1 0 11-2 0v-.382a2 2 0 01.894-1.664A2 2 0 009 9zm1 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="icon-sm">
      <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="icon-sm">
      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
    </svg>
  );
}

function IconTree() {
  return (
    <svg viewBox="0 0 24 24" fill="white" className="icon-nav">
      <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z" />
    </svg>
  );
}

function IconInfo() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="icon-nav">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-9-1a1 1 0 000 2v3a1 1 0 102 0V9a1 1 0 00-1-1H9zm1-5a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
    </svg>
  );
}

// ── TopNavBar ──────────────────────────────────────────────────────────────
export default function TopNavBar({ siteName = "Galicia Migrante" }) {
  const navItems = ["Inicio", "Árbol", "Descubrimientos", "Fotos", "Investigación"];

  return (
    <header>
      {/* ─ Chrome strip ─ */}
      <div className="chrome-bar">
        <div className="chrome-bar__left">
          <span className="chrome-bar__site-name">{siteName} Web Site</span>
          <button className="chrome-bar__icon-btn" title="Notificaciones"><IconBell /></button>
          <button className="chrome-bar__icon-btn" title="Mensajes"><IconMail /></button>
        </div>

        <div className="chrome-bar__right">
          <button className="btn-premium">⭐ Actualiza a Premium</button>
          <button className="chrome-bar__icon-btn" title="Carrito"><IconCart /></button>
          <div className="chrome-bar__user">
            <div className="chrome-bar__avatar">AP</div>
            <span>Alberto Sanchez Peña</span>
          </div>
          <button className="chrome-bar__icon-btn" title="Ayuda"><IconHelp /></button>
          <button className="chrome-bar__lang">🌐 Español</button>
        </div>
      </div>

      {/* ─ Main nav ─ */}
      <nav className="main-nav">
        <div className="main-nav__logo">
          <div className="main-nav__logo-icon">
            <IconTree />
          </div>
          <div className="main-nav__logo-text">
            <span className="main-nav__logo-line1">Galicia Migrante</span>
            <span className="main-nav__logo-line2">Portal Genealógico</span>
          </div>
        </div>

        <div className="main-nav__links">
          {navItems.map((item) => (
            <a
              key={item}
              href="#"
              className={`main-nav__link${item === "Árbol" ? " main-nav__link--active" : ""}`}
            >
              {item}
            </a>
          ))}
        </div>

        <div className="main-nav__right">
          <button className="main-nav__icon-btn" title="Información">
            <IconInfo />
          </button>
        </div>
      </nav>
    </header >
  );
}