import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import ProductCard from "@/components/ProductCard";
import LineFilter from "@/components/LineFilter";
import { api, resolveImageUrl, type Product, type Category, type Brand, type ProductFilters } from "@/lib/api";
import styles from "./Catalog.module.css";

function measureSortKey(p: Product): number {
  const src = p.measure ?? p.name;
  const match = src.match(/^(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : 9999;
}

function lineGroupKey(p: Product): string {
  return p.model_name ? `${p.brand.name} · ${p.model_name}` : p.brand.name;
}

const TIRE_SEGMENTS = [
  { value: "ciudad-carretera",label: "Ciudad-Carretera" },
  { value: "ciudad-sport",    label: "Ciudad-Sport" },
  { value: "sport-touring",   label: "Sport Touring" },
  { value: "super-sport",     label: "Super Sport" },
  { value: "doble-proposito", label: "Doble Propósito" },
  { value: "pista",           label: "Pista" },
  { value: "cross",           label: "Cross" },
  { value: "road-sport",      label: "Road Sport" },
];

export default function Catalog() {
  const { categoria } = useParams<{ categoria?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts]     = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands]         = useState<Brand[]>([]);
  const [measures, setMeasures]     = useState<string[]>([]);
  const [models, setModels]         = useState<string[]>([]);
  const [total, setTotal]           = useState(0);
  const [pages, setPages]           = useState(1);
  const [loading, setLoading]       = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [filters, setFilters] = useState<ProductFilters>(() => ({
    category:  categoria,
    brand:     searchParams.get("brand")     ?? undefined,
    segment:   searchParams.get("segment")   ?? undefined,
    measure:   searchParams.get("measure")   ?? undefined,
    model:     searchParams.get("model")     ?? undefined,
    search:    searchParams.get("search")    ?? undefined,
    is_promo:  searchParams.get("is_promo") === "true" ? true : undefined,
    min_price: searchParams.get("min_price") ? Number(searchParams.get("min_price")) : undefined,
    max_price: searchParams.get("max_price") ? Number(searchParams.get("max_price")) : undefined,
    page:      searchParams.get("page") ? Number(searchParams.get("page")) : 1,
    per_page:  24,
  }));

  const [searchVal, setSearchVal] = useState(searchParams.get("search") ?? "");
  const debounceRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipSyncRef    = useRef(false);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    api.getBrands(categoria).then(setBrands).catch(() => {});
  }, [categoria]);

  useEffect(() => {
    api.getMeasures(categoria, filters.brand).then(setMeasures).catch(() => {});
  }, [categoria, filters.brand]);

  useEffect(() => {
    api.getModels(categoria, filters.brand).then(setModels).catch(() => {});
  }, [categoria, filters.brand]);

  const fetchProducts = useCallback(async (f: ProductFilters) => {
    setLoading(true);
    try {
      const res = await api.getProducts(f);
      setProducts(res.items);
      setTotal(res.total);
      setPages(res.pages);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // URL es la fuente de verdad: cualquier cambio de categoría o params dispara fetch
  useEffect(() => {
    if (skipSyncRef.current) {
      skipSyncRef.current = false;
      return;
    }
    const f: ProductFilters = {
      category:  categoria,
      brand:     searchParams.get("brand")     ?? undefined,
      segment:   searchParams.get("segment")   ?? undefined,
      measure:   searchParams.get("measure")   ?? undefined,
      model:     searchParams.get("model")     ?? undefined,
      search:    searchParams.get("search")    ?? undefined,
      is_promo:  searchParams.get("is_promo") === "true" ? true : undefined,
      min_price: searchParams.get("min_price") ? Number(searchParams.get("min_price")) : undefined,
      max_price: searchParams.get("max_price") ? Number(searchParams.get("max_price")) : undefined,
      page:      searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      per_page:  24,
    };
    setFilters(f);
    if (!debounceRef.current) setSearchVal(f.search ?? "");
    fetchProducts(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoria, searchParams.toString()]);

  const applyFilters = useCallback((next: ProductFilters) => {
    const merged = { ...next, category: categoria ?? next.category };
    setFilters(merged);
    fetchProducts(merged);
    window.scrollTo({ top: 0, behavior: "smooth" });
    const params: Record<string, string> = {};
    if (merged.brand)     params.brand     = merged.brand;
    if (merged.segment)   params.segment   = merged.segment;
    if (merged.measure)   params.measure   = merged.measure;
    if (merged.model)     params.model     = merged.model;
    if (merged.search)    params.search    = merged.search;
    if (merged.is_promo)  params.is_promo  = "true";
    if (merged.min_price != null) params.min_price = String(merged.min_price);
    if (merged.max_price != null) params.max_price = String(merged.max_price);
    if (merged.page && merged.page > 1) params.page = String(merged.page);
    skipSyncRef.current = true;
    setSearchParams(params);
  }, [categoria, fetchProducts, setSearchParams]);

  // Debounced search
  const handleSearchChange = (val: string) => {
    setSearchVal(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      applyFilters({ ...filters, search: val || undefined, page: 1 });
    }, 380);
  };

  const update = (key: keyof ProductFilters, value: unknown) => {
    applyFilters({ ...filters, [key]: value || undefined, page: 1 });
  };

  const clear = () => {
    setSearchVal("");
    applyFilters({ page: 1, per_page: 24 });
  };

  const handlePage = (p: number) => {
    applyFilters({ ...filters, page: p });
  };

  const activeCount = [
    filters.brand, filters.segment, filters.measure, filters.model,
    filters.search, filters.is_promo, filters.min_price, filters.max_price,
  ].filter(Boolean).length;

  const categoryName = categories.find(
    (c) => c.slug === (categoria ?? filters.category)
  )?.name;

  const isLlantas = categoria === "llantas";
  const isAceites   = categoria === "aceites-y-lubricantes";
  const isPastillas = categoria === "pastillas-de-freno";

  const showSegment = isLlantas || (!isAceites && !isPastillas && !categoria);
  const showMeasure = isLlantas || (!isAceites && !isPastillas && !categoria);
  const showModel   = showMeasure;

  const mainBrands = brands;

  const groupedProducts = useMemo(() => {
    if (!showModel || filters.model) return null;
    const map = new Map<string, Product[]>();
    for (const p of products) {
      const k = lineGroupKey(p);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(p);
    }
    return Array.from(map.entries()).map(([key, items]) => ({
      key,
      items: [...items].sort((a, b) => measureSortKey(a) - measureSortKey(b)),
    }));
  }, [products, showModel, filters.model]);

  return (
    <main className={styles.main}>
      <div className={styles.layout}>

        {/* ── SIDEBAR ── */}
        <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
          <div className={styles.sidebarInner}>

            {/* Header sidebar */}
            <div className={styles.sidebarHeader}>
              <span className={styles.sidebarTitle}>
                <TuneIcon /> Filtros
              </span>
              {activeCount > 0 && (
                <button className={styles.clearBtn} onClick={clear}>
                  Limpiar ({activeCount})
                </button>
              )}
              <button className={styles.sidebarClose} onClick={() => setSidebarOpen(false)} aria-label="Cerrar filtros">
                <CloseIcon />
              </button>
            </div>

            {/* Segmento — solo llantas */}
            {showSegment && (
              <div className={styles.filterGroup}>
                <p className={styles.filterLabel}><SegmentIcon /> Segmento</p>
                <LineFilter
                  options={TIRE_SEGMENTS}
                  value={filters.segment}
                  onChange={(v) => update("segment", v)}
                  allLabel="Todos los segmentos"
                  clearLabel="Quitar filtro de segmento"
                  searchable={false}
                />
              </div>
            )}

            {/* Medida — solo llantas */}
            {showMeasure && (
              <div className={styles.filterGroup}>
                <p className={styles.filterLabel}><RulerIcon /> Medida</p>
                <LineFilter
                  options={measures}
                  value={filters.measure}
                  onChange={(v) => update("measure", v)}
                  allLabel="Todas las medidas"
                  searchPlaceholder="Buscar medida…"
                  clearLabel="Quitar filtro de medida"
                />
              </div>
            )}

            {/* Línea / Modelo */}
            {showModel && models.length > 0 && (
              <div className={styles.filterGroup}>
                <p className={styles.filterLabel}><ModelIcon /> Línea</p>
                <LineFilter
                  options={models}
                  value={filters.model}
                  onChange={(v) => update("model", v)}
                />
              </div>
            )}

            {/* Precio */}
            <div className={styles.filterGroup}>
              <p className={styles.filterLabel}><PriceIcon /> Precio</p>
              <div className={styles.priceRow}>
                <input
                  type="number"
                  className={styles.input}
                  placeholder="Mín $"
                  aria-label="Precio mínimo"
                  min={0}
                  value={filters.min_price ?? ""}
                  onChange={(e) => update("min_price", e.target.value ? Number(e.target.value) : undefined)}
                />
                <span className={styles.priceSep} aria-hidden="true">—</span>
                <input
                  type="number"
                  className={styles.input}
                  placeholder="Máx $"
                  aria-label="Precio máximo"
                  min={0}
                  value={filters.max_price ?? ""}
                  onChange={(e) => update("max_price", e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>
            </div>

            {/* Solo ofertas */}
            <div className={styles.filterGroup}>
              <label className={styles.checkItem}>
                <input
                  type="checkbox"
                  className={styles.radio}
                  checked={filters.is_promo ?? false}
                  onChange={(e) => update("is_promo", e.target.checked ? true : undefined)}
                />
                <span>Solo ofertas</span>
              </label>
            </div>

          </div>
        </aside>

        {/* Overlay móvil */}
        {sidebarOpen && (
          <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
        )}

        {/* ── CONTENT ── */}
        <div className={styles.content}>

          {/* Header */}
          <div className={styles.pageHeader}>
            <div className={styles.pageHeaderLeft}>
              <h1 className={styles.pageTitle}>
                {categoryName ?? "CATÁLOGO"}
              </h1>
              <p className={styles.pageCount}>
                {loading ? "Cargando…" : `${total} producto${total !== 1 ? "s" : ""}`}
              </p>
            </div>

            <div className={styles.headerActions}>
              {/* Search */}
              <div className={styles.searchWrap}>
                <SearchIcon />
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Buscar…"
                  aria-label="Buscar productos"
                  value={searchVal}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
                {searchVal && (
                  <button
                    className={styles.searchClear}
                    onClick={() => handleSearchChange("")}
                    aria-label="Limpiar búsqueda"
                  >
                    <CloseIcon />
                  </button>
                )}
              </div>

              {/* Toggle sidebar on mobile */}
              <button
                className={styles.filterToggle}
                onClick={() => setSidebarOpen(true)}
                aria-label="Abrir filtros"
              >
                <TuneIcon />
                Filtros
                {activeCount > 0 && <span className={styles.badge}>{activeCount}</span>}
              </button>
            </div>
          </div>

          {/* Marcas destacadas */}
          {mainBrands.length > 0 && (
            <div className={styles.brandStrip}>
              <p className={styles.brandStripLabel}><TagIcon /> Marcas</p>
              <div className={styles.brandStripRow}>
                <button
                  type="button"
                  className={`${styles.brandChip} ${!filters.brand ? styles.brandChipActive : ""}`}
                  onClick={() => applyFilters({ ...filters, brand: undefined, measure: undefined, model: undefined, page: 1 })}
                >
                  Todas las marcas
                </button>
                {mainBrands.map((b) => (
                  <BrandChip
                    key={b.id}
                    brand={b}
                    active={filters.brand === b.slug}
                    onClick={() => applyFilters({
                      ...filters,
                      brand: filters.brand === b.slug ? undefined : b.slug,
                      measure: undefined,
                      model: undefined,
                      page: 1,
                    })}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Active filters pills */}
          {activeCount > 0 && (
            <div className={styles.activePills}>
              {filters.segment && (
                <span className={styles.pill}>
                  {TIRE_SEGMENTS.find(s => s.value === filters.segment)?.label ?? filters.segment}
                  <button onClick={() => update("segment", undefined)} aria-label="Quitar filtro segmento"><CloseIcon /></button>
                </span>
              )}
              {filters.brand && (
                <span className={styles.pill}>
                  {brands.find(b => b.slug === filters.brand)?.name}
                  <button onClick={() => update("brand", undefined)} aria-label="Quitar filtro marca"><CloseIcon /></button>
                </span>
              )}
              {filters.measure && (
                <span className={styles.pill}>
                  {filters.measure}
                  <button onClick={() => update("measure", undefined)} aria-label="Quitar filtro medida"><CloseIcon /></button>
                </span>
              )}
              {filters.model && (
                <span className={styles.pill}>
                  {filters.model}
                  <button onClick={() => update("model", undefined)} aria-label="Quitar filtro línea"><CloseIcon /></button>
                </span>
              )}
              {filters.is_promo && (
                <span className={styles.pill}>
                  Ofertas
                  <button onClick={() => update("is_promo", undefined)} aria-label="Quitar filtro ofertas"><CloseIcon /></button>
                </span>
              )}
              <button className={styles.clearAllBtn} onClick={clear}>Limpiar todo</button>
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div className={styles.grid}>
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className={styles.skeleton} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}><TireIcon /></div>
              <h3 className={styles.emptyTitle}>Sin resultados</h3>
              <p className={styles.emptyText}>
                ¿No encontraste lo que buscabas?<br />Contáctanos.
              </p>
              <a
                href="https://wa.me/593959491417?text=Hola%2C%20no%20encontr%C3%A9%20lo%20que%20buscaba%20en%20el%20cat%C3%A1logo%2C%20%C2%BFme%20pueden%20ayudar%3F"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.emptyWaBtn}
              >
                <WhatsAppIcon /> Escríbenos
              </a>
            </div>
          ) : groupedProducts ? (
            <div className={styles.groupedGrid}>
              {groupedProducts.map(({ key, items }) => (
                <section key={key} className={styles.lineSection}>
                  <h2 className={styles.lineHeading}>
                    {key}
                    <span className={styles.lineCount}>{items.length}</span>
                  </h2>
                  <div className={styles.grid}>
                    {items.map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className={styles.grid}>
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && !loading && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                disabled={(filters.page ?? 1) <= 1}
                onClick={() => handlePage((filters.page ?? 1) - 1)}
              >
                ← Anterior
              </button>
              <div className={styles.pageNumbers}>
                {Array.from({ length: pages }, (_, i) => i + 1)
                  .filter(p => Math.abs(p - (filters.page ?? 1)) <= 2 || p === 1 || p === pages)
                  .reduce<(number | "...")[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "..." ? (
                      <span key={`ellipsis-${i}`} className={styles.pageDots}>…</span>
                    ) : (
                      <button
                        key={p}
                        className={`${styles.pageNum} ${p === (filters.page ?? 1) ? styles.pageNumActive : ""}`}
                        onClick={() => handlePage(p as number)}
                      >
                        {p}
                      </button>
                    )
                  )}
              </div>
              <button
                className={styles.pageBtn}
                disabled={(filters.page ?? 1) >= pages}
                onClick={() => handlePage((filters.page ?? 1) + 1)}
              >
                Siguiente →
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

/* ── Icons ──────────────────────────────────────────── */
function SearchIcon() {
  return (
    <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}
function TuneIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
    </svg>
  );
}
function TagIcon() {
  return (
    <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle cx="7" cy="7" r="1.5" fill="currentColor"/>
    </svg>
  );
}

function BrandChip({ brand, active, onClick }: { brand: Brand; active: boolean; onClick: () => void }) {
  const [broken, setBroken] = useState(false);
  const src = broken ? null : resolveImageUrl(brand.image_url);

  return (
    <button
      type="button"
      className={`${styles.brandChip} ${active ? styles.brandChipActive : ""}`}
      onClick={onClick}
      title={brand.name}
    >
      {src ? (
        <img src={src} alt="" draggable={false} onError={() => setBroken(true)} className={styles.brandChipImg} />
      ) : null}
      <span>{brand.name}</span>
    </button>
  );
}
function SegmentIcon() {
  return (
    <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 6h18M3 12h12M3 18h7"/>
    </svg>
  );
}
function ModelIcon() {
  return (
    <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function RulerIcon() {
  return (
    <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21.3 8.7 8.7 21.3c-1 1-2.5 1-3.4 0l-2.6-2.6c-1-1-1-2.5 0-3.4L15.3 2.7c1-1 2.5-1 3.4 0l2.6 2.6c1 1 1 2.5 0 3.4Z"/>
      <path d="m7.5 10.5 2 2"/><path d="m10.5 7.5 2 2"/><path d="m13.5 4.5 2 2"/>
    </svg>
  );
}
function PriceIcon() {
  return (
    <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  );
}
function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.123.555 4.116 1.527 5.845L.057 23.938l6.241-1.634A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.797 9.797 0 0 1-5.002-1.368l-.36-.213-3.706.972.988-3.617-.234-.373A9.787 9.787 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
    </svg>
  );
}
function TireIcon() {
  return (
    <svg aria-hidden="true" width="48" height="48" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="22" stroke="#333" strokeWidth="1.5"/>
      <circle cx="24" cy="24" r="12" stroke="#333" strokeWidth="1.5"/>
      <circle cx="24" cy="24" r="5" fill="#222"/>
    </svg>
  );
}
