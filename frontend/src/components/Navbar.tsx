import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { api, type Category } from "@/lib/api";
import styles from "./Navbar.module.css";

const WHATSAPP_NUMBER = "593959491417";

const CATEGORY_PRIORITY: Record<string, number> = {
  "llantas": 0,
  "aceites-y-lubricantes": 1,
};

function sortCategories(cats: Category[]): Category[] {
  return [...cats].sort(
    (a, b) => (CATEGORY_PRIORITY[a.slug] ?? 99) - (CATEGORY_PRIORITY[b.slug] ?? 99)
  );
}

export default function Navbar() {
  const { count, openCart } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const tapCountRef = useRef(0);
  const lastTapRef = useRef(0);

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  useEffect(() => {
    api.getCategories().then((cats) => setCategories(sortCategories(cats))).catch(() => {});
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setCatalogOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = overflow; };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const handleLogoClick = (e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastTapRef.current > 2000) {
      tapCountRef.current = 1;
    } else {
      tapCountRef.current += 1;
    }
    lastTapRef.current = now;

    if (tapCountRef.current >= 4) {
      tapCountRef.current = 0;
      e.preventDefault();
      navigate("/admin/login");
    }
  };

  return (
    <>
      <header className={styles.header}>
        <nav className={styles.nav}>
          <Link to="/" className={styles.logo} onClick={handleLogoClick}>
            <img src="/logo.png" alt="Two Wheels World" className={styles.logoImg} />
          </Link>

          <div className={styles.logoDivider} aria-hidden="true" />

          <ul className={styles.links}>
            <li>
              <Link
                to="/"
                className={`${styles.link} ${isActive("/") && location.pathname === "/" ? styles.linkActive : ""}`}
              >
                Inicio
              </Link>
            </li>
            <li className={styles.dropdown}>
              <span className={styles.dropdownTrigger}>
                <Link
                  to="/catalogo"
                  className={`${styles.link} ${isActive("/catalogo") ? styles.linkActive : ""}`}
                >
                  Catálogo
                </Link>
                {categories.length > 0 && (
                  <button
                    type="button"
                    className={styles.dropdownCaret}
                    aria-label="Ver categorías"
                  >
                    <ChevronIcon />
                  </button>
                )}
              </span>
              {categories.length > 0 && (
                <div className={styles.dropdownPanel}>
                  {categories.map((c) => (
                    <Link key={c.id} to={`/catalogo/${c.slug}`} className={styles.dropdownLink}>
                      {c.name}
                    </Link>
                  ))}
                </div>
              )}
            </li>
          </ul>

          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.waBtn}
          >
            <WhatsAppIcon />
            <span className={styles.waBtnText}>Escríbenos</span>
          </a>

          <button className={styles.cartBtn} onClick={openCart} aria-label="Abrir carrito">
            <CartIcon />
            {count > 0 && <span className={styles.cartBadge}>{count}</span>}
          </button>

          <button
            className={styles.menuBtn}
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
          >
            <MenuIcon open={menuOpen} />
          </button>
        </nav>
      </header>

      <div
        className={`${styles.mobileOverlay} ${menuOpen ? styles.mobileOverlayOpen : ""}`}
        onClick={closeMenu}
        aria-hidden="true"
      />
      <nav
        className={`${styles.mobileNav} ${menuOpen ? styles.mobileNavOpen : ""}`}
        aria-label="Navegación móvil"
        aria-hidden={!menuOpen}
      >
        <ul className={styles.mobileLinks}>
          <li>
            <Link
              to="/"
              className={`${styles.mobileLink} ${isActive("/") && location.pathname === "/" ? styles.mobileLinkActive : ""}`}
              onClick={closeMenu}
            >
              Inicio
            </Link>
          </li>
          <li>
            <div className={styles.mobileCatRow}>
              <Link
                to="/catalogo"
                className={`${styles.mobileLink} ${styles.mobileCatLabel} ${isActive("/catalogo") ? styles.mobileLinkActive : ""}`}
                onClick={closeMenu}
              >
                Catálogo
              </Link>
              {categories.length > 0 && (
                <button
                  type="button"
                  className={styles.mobileCatToggle}
                  onClick={() => setCatalogOpen((o) => !o)}
                  aria-label={catalogOpen ? "Ocultar categorías" : "Ver categorías"}
                  aria-expanded={catalogOpen}
                >
                  <ChevronIcon open={catalogOpen} />
                </button>
              )}
            </div>
            {categories.length > 0 && (
              <div className={`${styles.mobileCatPanel} ${catalogOpen ? styles.mobileCatPanelOpen : ""}`}>
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    to={`/catalogo/${c.slug}`}
                    className={styles.mobileCatLink}
                    onClick={closeMenu}
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            )}
          </li>
        </ul>
      </nav>
    </>
  );
}

function CartIcon() {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return open ? (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ) : (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

function ChevronIcon({ open }: { open?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s ease" }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.123.555 4.116 1.527 5.845L.057 23.938l6.241-1.634A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.797 9.797 0 0 1-5.002-1.368l-.36-.213-3.706.972.988-3.617-.234-.373A9.787 9.787 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
    </svg>
  );
}
