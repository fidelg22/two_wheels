import { useState } from "react";
import type { Category, Brand, ProductFilters } from "@/lib/api";
import styles from "./FilterPanel.module.css";

interface Props {
  categories: Category[];
  brands: Brand[];
  filters: ProductFilters;
  onChange: (filters: ProductFilters) => void;
}

export default function FilterPanel({ categories, brands, filters, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const update = (key: keyof ProductFilters, value: unknown) => {
    onChange({ ...filters, [key]: value || undefined, page: 1 });
  };

  const clear = () => onChange({ page: 1 });

  const activeCount = [
    filters.category, filters.brand, filters.application,
    filters.segment, filters.measure, filters.min_price, filters.max_price,
  ].filter(Boolean).length;

  return (
    <div className={styles.wrap}>
      <button className={styles.toggleBtn} onClick={() => setOpen((v) => !v)}>
        <FilterIcon />
        Filtros
        {activeCount > 0 && <span className={styles.badge}>{activeCount}</span>}
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className={styles.panel}>
          <div className={styles.grid}>
            {/* Category */}
            <div className={styles.group}>
              <label className={styles.groupLabel}>Categoría</label>
              <select
                className={styles.select}
                value={filters.category ?? ""}
                onChange={(e) => update("category", e.target.value)}
              >
                <option value="">Todas</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Brand */}
            <div className={styles.group}>
              <label className={styles.groupLabel}>Marca</label>
              <select
                className={styles.select}
                value={filters.brand ?? ""}
                onChange={(e) => update("brand", e.target.value)}
              >
                <option value="">Todas</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.slug}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Segment */}
            <div className={styles.group}>
              <label className={styles.groupLabel}>Segmento</label>
              <select
                className={styles.select}
                value={filters.segment ?? ""}
                onChange={(e) => update("segment", e.target.value)}
              >
                <option value="">Todos</option>
                <option value="calle">Calle</option>
                <option value="pista">Pista</option>
                <option value="offroad">Todo Terreno</option>
              </select>
            </div>

            {/* Measure search */}
            <div className={styles.group}>
              <label className={styles.groupLabel}>Medida</label>
              <input
                type="text"
                className={styles.input}
                placeholder="ej. 120/70-17"
                value={filters.measure ?? ""}
                onChange={(e) => update("measure", e.target.value)}
              />
            </div>

            {/* Price range */}
            <div className={styles.group}>
              <label className={styles.groupLabel}>Precio mínimo</label>
              <input
                type="number"
                className={styles.input}
                placeholder="$0"
                min={0}
                value={filters.min_price ?? ""}
                onChange={(e) => update("min_price", e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>

            <div className={styles.group}>
              <label className={styles.groupLabel}>Precio máximo</label>
              <input
                type="number"
                className={styles.input}
                placeholder="$999"
                min={0}
                value={filters.max_price ?? ""}
                onChange={(e) => update("max_price", e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>

            {/* Promo */}
            <div className={styles.group}>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={filters.is_promo ?? false}
                  onChange={(e) => update("is_promo", e.target.checked ? true : undefined)}
                />
                Solo ofertas
              </label>
            </div>
          </div>

          {activeCount > 0 && (
            <button className={styles.clearBtn} onClick={clear}>
              Limpiar filtros
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
    </svg>
  );
}
function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ transform: open ? "rotate(180deg)" : undefined, transition: "transform 200ms" }}>
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}
