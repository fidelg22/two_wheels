import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import styles from "./Login.module.css";

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      navigate("/admin");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>

      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logoWrap}>
          <img src="/logo.png" alt="Two Wheels World" className={styles.logo} />
        </div>

        {/* Header */}
        <div className={styles.header}>
          <span className={styles.eyebrow}>Panel de administración</span>
          <h1 className={styles.title}>Acceso restringido</h1>
          <p className={styles.subtitle}>Solo personal autorizado</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label htmlFor="tww-user" className="label">Usuario</label>
            <input
              id="tww-user"
              type="text"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              autoComplete="username"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="tww-pass" className="label">Contraseña</label>
            <div className={styles.passWrap}>
              <input
                id="tww-pass"
                type={showPass ? "text" : "password"}
                className={`input ${styles.passInput}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className={styles.passToggle}
                onClick={() => setShowPass(v => !v)}
                aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                tabIndex={0}
              >
                {showPass ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {error && (
            <p className={styles.error} role="alert">
              <AlertIcon />
              {error}
            </p>
          )}

          <button
            type="submit"
            className={`btn ${styles.submitBtn}`}
            disabled={loading}
          >
            {loading ? <><SpinnerIcon /> Ingresando...</> : "Ingresar al panel"}
          </button>
        </form>

        <p className={styles.cardFooter}>
          Two Wheels World &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

/* ── Icons ───────────────────────────────────────────── */

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className={styles.spinner}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  );
}
