import { useEffect, useState, useRef, Fragment } from "react";
import { api, type Product, type Category, type Brand } from "@/lib/api";
import styles from "./Products.module.css";

async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const token = localStorage.getItem("tww_token");
  const res = await fetch("/api/admin/upload-image", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (!res.ok) throw new Error("Error al subir la foto");
  const data = await res.json();
  return data.url as string;
}

type Mode = "list" | "edit" | "create";

// Segmentos de uso reales del catálogo — el valor guardado en "application"
// debe coincidir con el prefijo que usa el filtro de Segmento en el sitio
// público (ver SEGMENT_TO_PREFIX en backend/app/routers/products.py).
const SEGMENTS = [
  { label: "Ciudad-Carretera", value: "CIUDAD-CARRETERA" },
  { label: "Ciudad-Sport",     value: "CIUDAD-SPORT" },
  { label: "Sport Touring",    value: "SPORT TOURING" },
  { label: "Super Sport",      value: "SUPER SPORT" },
  { label: "Doble Propósito",  value: "DUAL" },
  { label: "Pista",            value: "TRACK" },
  { label: "Cross",            value: "CROSS" },
  { label: "Road Sport",       value: "ROAD SPORT" },
];

export default function AdminProducts() {
  const [mode, setMode] = useState<Mode>("list");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [modelOptions, setModelOptions] = useState<string[]>([]);
  const [customModel, setCustomModel] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterVisibility, setFilterVisibility] = useState(
    () => new URLSearchParams(window.location.search).get("visibility") || ""
  );
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  const emptyForm = {
    sku: "", name: "", application: "", category_id: 0, brand_id: 0,
    position: "", measure: "", model_name: "", price_cost: 0, price_pvp: 0, price_cash: null as number | null,
    stock: 1, active: true, image_url: "", is_promo: false, promo_price: null as number | null,
    promo_ends_at: null as string | null,
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
    api.getBrands().then(setBrands).catch(() => {});
  }, []);

  useEffect(() => {
    if (mode === "list") return;
    api.admin.getModels(form.brand_id || undefined).then((models) => {
      setModelOptions(models);
      setCustomModel((prev) => prev || (!!form.model_name && !models.includes(form.model_name)));
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, form.brand_id]);

  const loadProducts = async (p = page, s = search, fb = filterBrand, fc = filterCategory, fv = filterVisibility) => {
    setLoading(true);
    try {
      const res = await api.admin.getProducts({
        page: p,
        per_page: 500,
        search: s || undefined,
        brand: fb || undefined,
        category: fc || undefined,
        visibility: fv || undefined,
      });
      setProducts(res.items);
      setTotal(res.total);
      setPages(res.pages);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProducts(); }, []);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstSearch = useRef(true);
  useEffect(() => {
    if (isFirstSearch.current) { isFirstSearch.current = false; return; }
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      loadProducts(1, search, filterBrand, filterCategory, filterVisibility);
    }, 350);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTimer.current) clearTimeout(searchTimer.current);
    setPage(1);
    loadProducts(1, search, filterBrand, filterCategory, filterVisibility);
  };

  const handleFilterChange = (brand: string, category: string) => {
    setFilterBrand(brand);
    setFilterCategory(category);
    setPage(1);
    loadProducts(1, search, brand, category, filterVisibility);
  };

  const handleVisibilityChange = (visibility: string) => {
    setFilterVisibility(visibility);
    setPage(1);
    loadProducts(1, search, filterBrand, filterCategory, visibility);
  };

  const startEdit = (p: Product) => {
    setEditing(p);
    setForm({
      sku: p.sku ?? "",
      name: p.name,
      application: p.application ?? "",
      category_id: p.category.id,
      brand_id: p.brand.id,
      position: p.position ?? "",
      measure: p.measure ?? "",
      model_name: p.model_name ?? "",
      price_cost: Number(p.price_cost ?? 0),
      price_pvp: Number(p.price_pvp),
      price_cash: p.price_cash != null ? Number(p.price_cash) : null,
      stock: p.stock,
      active: p.active ?? true,
      image_url: p.image_url ?? "",
      is_promo: p.is_promo,
      promo_price: p.promo_price != null ? Number(p.promo_price) : null,
      promo_ends_at: p.promo_ends_at ? p.promo_ends_at.slice(0, 10) : null,
    });
    setCustomModel(false);
    setMode("edit");
  };

  const startCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, category_id: categories[0]?.id ?? 0, brand_id: brands[0]?.id ?? 0 });
    setCustomModel(false);
    setMode("create");
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg("");
    try {
      const body = {
        ...form,
        sku: form.sku || undefined,
        application: form.application || undefined,
        position: form.position || undefined,
        measure: form.measure || undefined,
        model_name: form.model_name || undefined,
        price_cash: form.price_cash ?? undefined,
        image_url: form.image_url || undefined,
        promo_price: form.promo_price ?? undefined,
        promo_ends_at: form.promo_ends_at ? new Date(form.promo_ends_at).toISOString() : undefined,
      };
      if (mode === "edit" && editing) {
        await api.admin.updateProduct(editing.id, body);
      } else {
        await api.admin.createProduct(body);
      }
      setMsg("Guardado correctamente");
      setMode("list");
      loadProducts();
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este producto? Esta acción no se puede deshacer.")) return;
    await api.admin.deleteProduct(id);
    loadProducts();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportLoading(true);
    setMsg("");
    try {
      const res = await api.admin.importExcel(file);
      setMsg(`Importación completada: ${res.created} productos creados, ${res.skipped} omitidos.`);
      loadProducts();
    } catch {
      setMsg("Error al importar el archivo.");
    } finally {
      setImportLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const f = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const el = e.target;
    const value = el.type === "checkbox" ? (el as HTMLInputElement).checked :
                  el.type === "number"   ? (el.value === "" ? null : Number(el.value)) :
                  el.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  if (mode === "edit" || mode === "create") {
    return (
      <div className={styles.formPage}>
        <div className={styles.formHeader}>
          <button className={styles.backBtn} onClick={() => setMode("list")}>← Volver</button>
          <h1 className={styles.pageTitle}>{mode === "edit" ? "Editar producto" : "Nuevo producto"}</h1>
        </div>

        {msg && <p className={msg.includes("Error") ? styles.msgError : styles.msgOk}>{msg}</p>}

        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label className="label">Nombre del producto *</label>
            <input type="text" className="input" value={form.name} onChange={f("name")} required />
          </div>
          <div className={styles.field}>
            <label className="label">SKU / Código</label>
            <input type="text" className="input" value={form.sku} onChange={f("sku")} />
          </div>
          <div className={styles.field}>
            <label className="label">Categoría *</label>
            <select className="input" value={form.category_id} onChange={f("category_id")}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label className="label">Marca *</label>
            <select className="input" value={form.brand_id} onChange={f("brand_id")}>
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label className="label">Aplicación / Uso</label>
            <select className="input" value={form.application} onChange={f("application")}>
              <option value="">Ninguna</option>
              {SEGMENTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label className="label">Medida</label>
            <input type="text" className="input" value={form.measure} onChange={f("measure")} placeholder="ej. 120/70-17" />
          </div>
          <div className={styles.field}>
            <label className="label">Línea</label>
            <select
              className="input"
              value={customModel ? "__custom__" : form.model_name}
              onChange={(e) => {
                if (e.target.value === "__custom__") {
                  setCustomModel(true);
                  setForm((prev) => ({ ...prev, model_name: "" }));
                } else {
                  setCustomModel(false);
                  setForm((prev) => ({ ...prev, model_name: e.target.value }));
                }
              }}
            >
              <option value="">No aplica</option>
              {modelOptions.map((m) => <option key={m} value={m}>{m}</option>)}
              <option value="__custom__">+ Nueva línea…</option>
            </select>
            {customModel && (
              <input
                type="text"
                className="input"
                value={form.model_name}
                onChange={f("model_name")}
                placeholder="Nombre de la nueva línea"
                autoFocus
                style={{ marginTop: "var(--space-2)" }}
              />
            )}
          </div>
          <div className={styles.field}>
            <label className="label">Stock</label>
            <input type="number" className="input" min={0} value={form.stock} onChange={f("stock")} />
          </div>
          <div className={styles.field}>
            <label className="label">Precio P.V.P. (público) *</label>
            <input type="number" className="input" min={0} step="0.01" value={form.price_pvp} onChange={f("price_pvp")} />
          </div>
          <div className={styles.field}>
            <label className="label">Precio costo (interno)</label>
            <input type="number" className="input" min={0} step="0.01" value={form.price_cost} onChange={f("price_cost")} />
          </div>
          <div className={styles.field}>
            <label className="label">Precio efectivo (interno)</label>
            <input type="number" className="input" min={0} step="0.01" value={form.price_cash ?? ""} onChange={f("price_cash")} placeholder="Dejar vacío si no aplica" />
          </div>
          <div className={styles.field}>
            <label className="label">Foto del producto</label>
            <div className={styles.imageUploadRow}>
              {form.image_url && (
                <img
                  src={form.image_url.startsWith("/uploads") ? `/api${form.image_url}` : form.image_url}
                  alt="preview"
                  className={styles.imagePreview}
                />
              )}
              <div className={styles.imageUploadActions}>
                <input
                  ref={imageRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: "none" }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setImageUploading(true);
                    try {
                      const url = await uploadImage(file);
                      setForm((prev) => ({ ...prev, image_url: url }));
                    } catch { setMsg("Error al subir la foto"); }
                    finally { setImageUploading(false); if (imageRef.current) imageRef.current.value = ""; }
                  }}
                />
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => imageRef.current?.click()}
                  disabled={imageUploading}
                >
                  {imageUploading ? "Subiendo..." : form.image_url ? "Cambiar foto" : "Subir foto"}
                </button>
                {form.image_url && (
                  <button type="button" className={styles.removeImageBtn} onClick={() => setForm((p) => ({ ...p, image_url: "" }))}>
                    Quitar foto
                  </button>
                )}
              </div>
            </div>
            <p className={styles.fieldHint}>JPG, PNG o WEBP. La foto se guarda en el servidor.</p>
          </div>
          <div className={styles.fieldFull}>
            <label className={styles.checkLabel}>
              <input type="checkbox" checked={form.active} onChange={f("active")} />
              Producto activo (visible en el sitio si además tiene stock)
            </label>
          </div>
          <div className={styles.fieldFull}>
            <label className={styles.checkLabel}>
              <input type="checkbox" checked={form.is_promo} onChange={f("is_promo")} />
              Marcar como oferta / promoción
            </label>
          </div>
          {form.is_promo && (
            <>
              <div className={styles.field}>
                <label className="label">Precio de oferta</label>
                <input type="number" className="input" min={0} step="0.01" value={form.promo_price ?? ""} onChange={f("promo_price")} />
              </div>
              <div className={styles.field}>
                <label className="label">Oferta válida hasta</label>
                <input type="date" className="input" value={form.promo_ends_at ?? ""} onChange={f("promo_ends_at")} />
              </div>
            </>
          )}
        </div>

        <div className={styles.formActions}>
          <button className="btn" onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar producto"}
          </button>
          <button className="btn btn-ghost" onClick={() => setMode("list")}>Cancelar</button>
        </div>
      </div>
    );
  }

  // ── Agrupación tipo Excel ────────────────────────────────
  function isOil(p: Product): boolean {
    return p.category.slug === "aceites-y-lubricantes";
  }

  function getModelKey(p: Product): string {
    return p.model_name ?? p.name;
  }

  function measureSortKey(p: Product): number {
    const src = p.measure ?? p.name;
    const match = src.match(/^(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : 9999;
  }

  type ModelGroup = { key: string; items: Product[] };
  type BrandGroup = { brand: string; models: ModelGroup[] };

  function groupProducts(list: Product[]): BrandGroup[] {
    const brandMap = new Map<string, Map<string, Product[]>>();
    for (const p of list) {
      const b = isOil(p) ? "Aceites" : p.brand.name;
      const m = isOil(p) ? "" : getModelKey(p);
      if (!brandMap.has(b)) brandMap.set(b, new Map());
      const modelMap = brandMap.get(b)!;
      if (!modelMap.has(m)) modelMap.set(m, []);
      modelMap.get(m)!.push(p);
    }
    return Array.from(brandMap.entries()).map(([brand, modelMap]) => ({
      brand,
      models: Array.from(modelMap.entries()).map(([key, items]) => ({
        key,
        items: [...items].sort((a, b) => measureSortKey(a) - measureSortKey(b)),
      })),
    }));
  }

  const GROUPED_COLS = 10;

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Productos <span className={styles.totalBadge}>{total}</span></h1>
        <div className={styles.headerActions}>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            className={styles.fileInput}
            id="importFile"
            onChange={handleImport}
          />
          <label htmlFor="importFile" className={`btn btn-ghost ${importLoading ? styles.loading : ""}`}>
            {importLoading ? "Importando..." : "Importar Excel"}
          </label>
          <button className="btn" onClick={startCreate}>+ Nuevo producto</button>
        </div>
      </div>

      {msg && <p className={msg.includes("Error") ? styles.msgError : styles.msgOk}>{msg}</p>}

      {/* ── Filtros ── */}
      <form className={styles.filterBar} onSubmit={handleSearch}>
        <input
          type="search"
          className="input"
          placeholder="Buscar por nombre o código..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="input"
          value={filterBrand}
          onChange={(e) => handleFilterChange(e.target.value, "")}
        >
          <option value="">Todas las marcas</option>
          {brands.map((b) => (
            <option key={b.id} value={b.slug}>{b.name}</option>
          ))}
        </select>
        <select
          className="input"
          value={filterCategory}
          onChange={(e) => handleFilterChange("", e.target.value)}
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
        <select
          className="input"
          value={filterVisibility}
          onChange={(e) => handleVisibilityChange(e.target.value)}
        >
          <option value="">Visibles y no visibles</option>
          <option value="visible">Solo visibles en el sitio</option>
          <option value="hidden">Solo no visibles</option>
        </select>
        <button type="submit" className="btn btn-ghost">Buscar</button>
        {(filterBrand || filterCategory || filterVisibility || search) && (
          <button
            type="button"
            className={`btn btn-ghost ${styles.clearBtn}`}
            onClick={() => {
              setSearch("");
              setFilterBrand("");
              setFilterCategory("");
              setFilterVisibility("");
              setPage(1);
              loadProducts(1, "", "", "", "");
            }}
          >
            Limpiar
          </button>
        )}
      </form>

      {loading ? (
        <p className={styles.loadingText}>Cargando...</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <colgroup>
              <col className={styles.colSku} />
              <col className={styles.colName} />
              <col className={styles.colCat} />
              <col className={styles.colPrice} />
              <col className={styles.colPrice} />
              <col className={styles.colPrice} />
              <col className={styles.colStock} />
              <col className={styles.colActive} />
              <col className={styles.colImg} />
              <col className={styles.colActions} />
            </colgroup>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Descripción / Medida</th>
                <th>Categoría</th>
                <th>Compra</th>
                <th>P.V.P.</th>
                <th>Efectivo</th>
                <th>Stock</th>
                <th>Activo</th>
                <th>Foto</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {groupProducts(products).map(({ brand, models }) =>
                models.map(({ key, items }) => (
                  <Fragment key={`g-${brand}-${key}`}>
                    <tr className={styles.groupRow}>
                      <td colSpan={GROUPED_COLS}>
                        <span className={styles.groupBrand}>{brand}</span>
                        {key && (
                          <>
                            <span className={styles.groupSep}> · </span>
                            <span className={styles.groupModel}>{key}</span>
                          </>
                        )}
                        <span className={styles.groupCount}>{items.length} ref.</span>
                      </td>
                    </tr>
                    {items.map((p) => (
                        <tr key={p.id} className={styles.subRow}>
                          <td className={styles.mono}>{p.sku ?? "—"}</td>
                          <td className={styles.subName}>{p.name}</td>
                          <td className={styles.catCell}>{p.category.name}</td>
                          <td className={styles.mono}>{p.price_cost != null ? `$${Number(p.price_cost).toFixed(2)}` : "—"}</td>
                          <td className={styles.mono}>${Number(p.price_pvp).toFixed(2)}</td>
                          <td className={styles.mono}>{p.price_cash != null ? `$${Number(p.price_cash).toFixed(2)}` : "—"}</td>
                          <td className={`${styles.mono} ${p.stock === 0 ? styles.stockZero : ""}`}>{p.stock}</td>
                          <td><span className={p.active ? styles.yes : styles.no}>{p.active ? "Sí" : "No"}</span></td>
                          <td className={styles.imgCell}>
                            {p.image_url
                              ? <span className={styles.imgYes} title={p.image_url}>✓</span>
                              : <span className={styles.imgNo}>✕</span>
                            }
                          </td>
                          <td className={styles.actions}>
                            <button className={styles.editBtn} onClick={() => startEdit(p)}>Editar</button>
                            <button className={styles.deleteBtn} onClick={() => handleDelete(p.id)}>Eliminar</button>
                          </td>
                        </tr>
                    ))}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
