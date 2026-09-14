import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import styles from "./Dashboard.module.css";

function MenuIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>;
}
function CloseIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}

const NAV_ITEMS = [
  { to: "/admin",            label: "Inicio",            icon: <HomeIcon />,  exact: true },
  { to: "/admin/productos",  label: "Productos",         icon: <BoxIcon />,   exact: false },
  { to: "/admin/galeria",    label: "Galería",           icon: <ImageIcon />, exact: false },
  { to: "/admin/categorias", label: "Categorías y Marcas", icon: <TagIcon />, exact: false },
];

const SECTION_CARDS = [
  {
    to: "/admin/productos",
    label: "Productos",
    desc: "Agrega, edita o elimina productos del catálogo.",
    icon: <BoxIcon />,
  },
  {
    to: "/admin/galeria",
    label: "Galería",
    desc: "Sube y organiza las fotos de la tienda.",
    icon: <ImageIcon />,
  },
  {
    to: "/admin/categorias",
    label: "Categorías y Marcas",
    desc: "Organiza las categorías y marcas del catálogo.",
    icon: <TagIcon />,
  },
];

interface Stats { total: number; active: number; no_stock: number; promo: number; }

export default function AdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState<Stats | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isExact = location.pathname === "/admin";

  useEffect(() => {
    if (isExact) api.admin.getStats().then(setStats).catch(() => {});
  }, [isExact]);

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate("/admin/login"); };

  return (
    <div className={styles.layout}>
      {/* ── Mobile top bar ── */}
      <div className={styles.mobileTopBar}>
        <button
          className={styles.menuBtn}
          onClick={() => setSidebarOpen(true)}
          aria-label="Abrir menú"
        >
          <MenuIcon />
        </button>
        <img src="/logo.png" alt="Two Wheels World" className={styles.mobileLogoImg} />
        <span className={styles.logoAdmin}>ADMIN</span>
      </div>

      {/* ── Overlay (mobile) ── */}
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.sidebarLogo}>
          <img src="/logo.png" alt="Two Wheels World" className={styles.logoImg} />
          <span className={styles.logoAdmin}>ADMIN</span>
          <button
            className={styles.sidebarClose}
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menú"
          >
            <CloseIcon />
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          {NAV_ITEMS.map((item) => {
            const active = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            return (
            <Link
              key={item.to}
              to={item.to}
              className={`${styles.navItem} ${active ? styles.navActive : ""}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {item.label}
            </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link to="/" className={styles.siteLink}>
            <ArrowLeftIcon />
            Ver sitio público
          </Link>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <LogoutIcon />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className={styles.content}>
        {isExact ? (
          <div className={styles.home}>
            <div className={styles.homeHeader}>
              <p className={styles.homeEyebrow}>Panel de control</p>
              <h1 className={styles.homeTitle}>Bienvenido</h1>
            </div>

            {/* Métricas */}
            <div className={styles.statsGrid}>
              <StatCard label="Total productos" value={stats?.total} color="default" icon={<BoxIcon />} />
              <StatCard label="Visibles en sitio" value={stats?.active} color="green" icon={<CheckIcon />} />
              <StatCard
                label="No visibles"
                value={stats ? stats.total - stats.active : undefined}
                color="red"
                icon={<EyeOffIcon />}
                to="/admin/productos?visibility=hidden"
              />
              <StatCard label="Sin stock" value={stats?.no_stock} color="orange" icon={<WarningIcon />} />
              <StatCard label="En promoción" value={stats?.promo} color="accent" icon={<TagIcon />} />
            </div>

            {/* Cards de sección */}
            <div className={styles.sectionCards}>
              {SECTION_CARDS.map((card) => (
                <Link key={card.to} to={card.to} className={styles.sectionCard}>
                  <div className={styles.sectionCardIcon}>{card.icon}</div>
                  <div>
                    <p className={styles.sectionCardLabel}>{card.label}</p>
                    <p className={styles.sectionCardDesc}>{card.desc}</p>
                  </div>
                  <ArrowRightIcon />
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, color, icon, to }: { label: string; value?: number; color: string; icon: React.ReactNode; to?: string }) {
  const className = `${styles.statCard} ${styles[`statCard_${color}`]} ${to ? styles.statCardLink : ""}`;
  const content = (
    <>
      <div className={styles.statCardIcon}>{icon}</div>
      <div className={styles.statCardValue}>
        {value === undefined ? <span className={styles.statSkeleton} /> : value}
      </div>
      <div className={styles.statCardLabel}>{label}</div>
    </>
  );
  if (to) {
    return <Link to={to} className={className}>{content}</Link>;
  }
  return <div className={className}>{content}</div>;
}

function HomeIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
}
function BoxIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>;
}
function ImageIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;
}
function TagIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>;
}
function CheckIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
}
function EyeOffIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
}
function WarningIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
}
function ArrowLeftIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;
}
function ArrowRightIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
}
function LogoutIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}
