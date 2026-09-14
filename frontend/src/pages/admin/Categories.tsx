import { useEffect, useRef, useState } from "react";
import { api, type Category, type Brand } from "@/lib/api";
import styles from "./Categories.module.css";

function slugify(t: string) {
  return t.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-");
}

async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const token = localStorage.getItem("tww_token");
  const res = await fetch("/api/admin/upload-image", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (!res.ok) throw new Error("Error al subir la imagen");
  const data = await res.json();
  return data.url as string;
}

type EditTarget = { type: "category" | "brand"; item: Category | Brand } | null;

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [editTarget, setEditTarget] = useState<EditTarget>(null);

  const load = async () => {
    const [cats, brs] = await Promise.all([api.getCategories(), api.getBrands()]);
    setCategories(cats);
    setBrands(brs);
  };

  useEffect(() => { load(); }, []);

  const notify = (text: string, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3500);
  };

  const handleDeleteCategory = async (id: number, name: string) => {
    if (!confirm(`¿Eliminar la categoría "${name}"? Los productos asociados quedarán sin categoría.`)) return;
    try {
      await api.admin.deleteCategory(id);
      notify("Categoría eliminada");
      load();
    } catch (e: unknown) { notify(e instanceof Error ? e.message : "Error al eliminar", false); }
  };

  const handleDeleteBrand = async (id: number, name: string) => {
    if (!confirm(`¿Eliminar la marca "${name}"? Los productos asociados quedarán sin marca.`)) return;
    try {
      await api.admin.deleteBrand(id);
      notify("Marca eliminada");
      load();
    } catch (e: unknown) { notify(e instanceof Error ? e.message : "Error al eliminar", false); }
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Categorías y Marcas</h1>
        <p className={styles.pageSub}>Gestiona las categorías y marcas del catálogo.</p>
      </div>

      {msg && (
        <div className={`${styles.toast} ${msg.ok ? styles.toastOk : styles.toastErr}`}>
          {msg.ok ? <CheckIcon /> : <XIcon />}
          {msg.text}
        </div>
      )}

      <div className={styles.grid}>
        {/* ── Categorías ── */}
        <Section
          title="Categorías"
          count={categories.length}
          onAdd={async (name, imageUrl) => {
            await api.admin.createCategory(name, slugify(name), imageUrl);
            notify("Categoría creada");
            await load();
          }}
          addPlaceholder="Nueva categoría..."
        >
          {categories.map((c) => (
            <ItemRow
              key={c.id}
              name={c.name}
              slug={c.slug}
              imageUrl={c.image_url}
              onEdit={() => setEditTarget({ type: "category", item: c })}
              onDelete={() => handleDeleteCategory(c.id, c.name)}
            />
          ))}
        </Section>

        {/* ── Marcas ── */}
        <Section
          title="Marcas"
          count={brands.length}
          onAdd={async (name, imageUrl) => {
            await api.admin.createBrand(name, slugify(name), imageUrl);
            notify("Marca creada");
            await load();
          }}
          addPlaceholder="Nueva marca..."
        >
          {brands.map((b) => (
            <ItemRow
              key={b.id}
              name={b.name}
              slug={b.slug}
              imageUrl={b.image_url}
              onEdit={() => setEditTarget({ type: "brand", item: b })}
              onDelete={() => handleDeleteBrand(b.id, b.name)}
            />
          ))}
        </Section>
      </div>

      {editTarget && (
        <EditModal
          key={`${editTarget.type}-${editTarget.item.id}`}
          type={editTarget.type}
          item={editTarget.item}
          onClose={() => setEditTarget(null)}
          onSave={async (name, imageUrl) => {
            if (editTarget.type === "category") {
              await api.admin.updateCategory(editTarget.item.id, name, slugify(name), imageUrl);
              notify("Categoría actualizada");
            } else {
              await api.admin.updateBrand(editTarget.item.id, name, slugify(name), imageUrl);
              notify("Marca actualizada");
            }
            await load();
            setEditTarget(null);
          }}
        />
      )}
    </div>
  );
}

/* ── Section ────────────────────────────────────────────── */
function Section({ title, count, onAdd, addPlaceholder, children }: {
  title: string;
  count: number;
  onAdd: (name: string, imageUrl?: string) => Promise<void>;
  addPlaceholder: string;
  children: React.ReactNode;
}) {
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const imgRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onAdd(name.trim(), imageUrl);
      setName("");
      setImageUrl(undefined);
    } finally { setSaving(false); }
  };

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>
        {title}
        <span className={styles.sectionCount}>{count}</span>
      </h2>

      <form className={styles.addForm} onSubmit={handleSubmit}>
        <input
          type="text"
          className="input"
          placeholder={addPlaceholder}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input ref={imgRef} type="file" accept="image/*" style={{ display: "none" }}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setUploading(true);
            try { setImageUrl(await uploadImage(file)); }
            finally { setUploading(false); if (imgRef.current) imgRef.current.value = ""; }
          }}
        />
        <button type="button" className={`btn btn-ghost ${styles.imgBtn}`} onClick={() => imgRef.current?.click()} disabled={uploading}>
          {uploading ? "Subiendo..." : imageUrl ? <><ImageIcon />&nbsp;Cambiar</> : <><ImageIcon />&nbsp;Imagen</>}
        </button>
        {imageUrl && <img src={imageUrl.startsWith("/uploads") ? `/api${imageUrl}` : imageUrl} className={styles.addPreview} alt="preview" />}
        <button type="submit" className="btn" disabled={saving || uploading}>
          {saving ? "Guardando..." : "Agregar"}
        </button>
      </form>

      <ul className={styles.list}>{children}</ul>
    </div>
  );
}

/* ── ItemRow ────────────────────────────────────────────── */
function ItemRow({ name, slug, imageUrl, onEdit, onDelete }: {
  name: string; slug: string; imageUrl?: string | null;
  onEdit: () => void; onDelete: () => void;
}) {
  const src = imageUrl ? (imageUrl.startsWith("/uploads") ? `/api${imageUrl}` : imageUrl) : null;
  return (
    <li className={styles.item}>
      <div className={styles.itemThumb}>
        {src
          ? <img src={src} alt={name} />
          : <span className={styles.itemThumbPlaceholder}>{name[0]}</span>
        }
      </div>
      <div className={styles.itemInfo}>
        <span className={styles.itemName}>{name}</span>
        <code className={styles.itemSlug}>{slug}</code>
      </div>
      <div className={styles.itemActions}>
        <button className={styles.editBtn} onClick={onEdit} title="Editar"><PencilIcon /></button>
        <button className={styles.deleteBtn} onClick={onDelete} title="Eliminar"><TrashIcon /></button>
      </div>
    </li>
  );
}

/* ── EditModal ──────────────────────────────────────────── */
function EditModal({ type, item, onClose, onSave }: {
  type: "category" | "brand";
  item: Category | Brand;
  onClose: () => void;
  onSave: (name: string, imageUrl?: string | null) => Promise<void>;
}) {
  const [name, setName] = useState(item.name);
  const [imageUrl, setImageUrl] = useState<string | null | undefined>(item.image_url);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const imgRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(item.name);
    setImageUrl(item.image_url);
  }, [item.id, item.image_url]);

  const label = type === "category" ? "categoría" : "marca";
  const src = imageUrl ? (imageUrl.startsWith("/uploads") ? `/api${imageUrl}` : imageUrl) : null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try { await onSave(name.trim(), imageUrl); }
    finally { setSaving(false); }
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Editar {label}</h3>
          <button className={styles.modalClose} onClick={onClose}><XIcon /></button>
        </div>

        <form onSubmit={handleSave} className={styles.modalForm}>
          <label className="label">Nombre</label>
          <input
            type="text"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label className="label" style={{ marginTop: "var(--space-4)" }}>Imagen</label>
          <div className={styles.modalImageRow}>
            {src
              ? <img src={src} alt={name} className={styles.modalPreview} />
              : <div className={styles.modalPreviewEmpty}><ImageIcon /></div>
            }
            <div className={styles.modalImageBtns}>
              <input ref={imgRef} type="file" accept="image/*" style={{ display: "none" }}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploading(true);
                  try { setImageUrl(await uploadImage(file)); }
                  finally { setUploading(false); if (imgRef.current) imgRef.current.value = ""; }
                }}
              />
              <button type="button" className="btn btn-ghost" onClick={() => imgRef.current?.click()} disabled={uploading}>
                {uploading ? "Subiendo..." : src ? "Cambiar imagen" : "Subir imagen"}
              </button>
              {src && (
                <button type="button" className={styles.removeImgBtn} onClick={() => setImageUrl(null)}>
                  Quitar imagen
                </button>
              )}
            </div>
          </div>

          <div className={styles.modalActions}>
            <button type="submit" className="btn" disabled={saving || uploading}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Icons ──────────────────────────────────────────────── */
function PencilIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
}
function TrashIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
}
function ImageIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;
}
function CheckIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
}
function XIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}
