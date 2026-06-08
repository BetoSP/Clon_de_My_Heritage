import { forwardRef } from "react";

const FooterBar = forwardRef(function FooterBar(props, ref) {
  return (
    <footer ref={ref} className="footer-bar">
      © 2026 Galicia Migrante · Todos los derechos reservados · v0.1.0-dev
    </footer>
  );
});

export default FooterBar;
