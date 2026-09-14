import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./LineFilter.module.css";

export interface FilterOption {
  value: string;
  label: string;
}

interface Props {
  options: string[] | FilterOption[];
  value?: string;
  onChange: (value: string | undefined) => void;
  allLabel?: string;
  searchPlaceholder?: string;
  clearLabel?: string;
  searchable?: boolean;
}

export default function LineFilter({
  options,
  value,
  onChange,
  allLabel = "Todas las líneas",
  searchPlaceholder = "Buscar línea…",
  clearLabel = "Quitar filtro de línea",
  searchable = true,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const normalized: FilterOption[] = useMemo(
    () => options.map((o) => (typeof o === "string" ? { value: o, label: o } : o)),
    [options]
  );

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery("");
      if (searchable) requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open, searchable]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return normalized;
    return normalized.filter((o) => o.label.toLowerCase().includes(q));
  }, [normalized, query]);

  const selectedLabel = normalized.find((o) => o.value === value)?.label ?? value;

  const select = (v: string | undefined) => {
    onChange(v);
    setOpen(false);
  };

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={`${styles.trigger} ${value ? styles.triggerActive : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={styles.triggerText}>{selectedLabel ?? allLabel}</span>
        {value ? (
          <span
            className={styles.clearDot}
            role="button"
            aria-label={clearLabel}
            onClick={(e) => { e.stopPropagation(); select(undefined); }}
          >
            <CloseIcon />
          </span>
        ) : (
          <ChevronIcon open={open} />
        )}
      </button>

      {open && (
        <div className={styles.panel} role="listbox">
          {searchable && (
            <div className={styles.searchRow}>
              <SearchIcon />
              <input
                ref={inputRef}
                type="text"
                className={styles.searchInput}
                placeholder={searchPlaceholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          )}
          <div className={styles.optionList}>
            <button
              type="button"
              className={`${styles.option} ${!value ? styles.optionActive : ""}`}
              onClick={() => select(undefined)}
            >
              {allLabel}
            </button>
            {filtered.length === 0 ? (
              <p className={styles.noMatch}>Sin coincidencias</p>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  className={`${styles.option} ${value === o.value ? styles.optionActive : ""}`}
                  onClick={() => select(o.value)}
                >
                  {o.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? "rotate(180deg)" : undefined, transition: "transform 200ms" }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
