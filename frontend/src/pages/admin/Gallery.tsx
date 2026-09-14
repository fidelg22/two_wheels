import { useEffect, useRef, useState } from "react";
import { api, type GalleryImage } from "@/lib/api";
import styles from "./Gallery.module.css";

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

export default function AdminGallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [caption, setCaption] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [preview, setPreview] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try { setImages(await api.getGallery()); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setSaving(true);
    setMsg("");
    try {
      const url = await uploadImage(selectedFile);
      await api.admin.addGalleryImage(url, caption || undefined, images.length);
      setSelectedFile(null);
      setPreview("");
      setCaption("");
      if (fileRef.current) fileRef.current.value = "";
      setMsg("Foto agregada correctamente");
      load();
    } catch { setMsg("Error al agregar la foto"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar esta foto?")) return;
    await api.admin.deleteGalleryImage(id);
    load();
  };

  return (
    <div>
      <h1 className={styles.title}>Galería de experiencias</h1>
      <p className={styles.subtitle}>
        Las fotos que agregues acá aparecen en la sección de experiencias del sitio web.
      </p>

      <form className={styles.addForm} onSubmit={handleAdd}>
        <div className={styles.uploadRow}>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: "none" }}
            onChange={handleFileSelect}
          />
          {preview ? (
            <img src={preview} alt="preview" className={styles.previewImg} />
          ) : (
            <button
              type="button"
              className={styles.selectBtn}
              onClick={() => fileRef.current?.click()}
            >
              <span className={styles.selectIcon}>📷</span>
              <span>Elegir foto</span>
            </button>
          )}
          {preview && (
            <div className={styles.uploadActions}>
              <button type="button" className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
                Cambiar foto
              </button>
              <button
                type="button"
                className={styles.clearBtn}
                onClick={() => { setPreview(""); setSelectedFile(null); if (fileRef.current) fileRef.current.value = ""; }}
              >
                Quitar
              </button>
            </div>
          )}
        </div>

        <div className={styles.field}>
          <label className="label">Descripción (opcional)</label>
          <input
            type="text"
            className="input"
            placeholder="ej. Cliente con su moto recién equipada"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
        </div>

        {msg && <p className={msg.includes("Error") ? styles.msgError : styles.msgOk}>{msg}</p>}

        <button type="submit" className="btn" disabled={saving || !selectedFile}>
          {saving ? "Subiendo..." : "Agregar foto"}
        </button>
      </form>

      <div className={styles.divider} />

      <h2 className={styles.sectionTitle}>Fotos actuales ({images.length})</h2>

      {loading ? (
        <p className={styles.loadingText}>Cargando...</p>
      ) : images.length === 0 ? (
        <p className={styles.empty}>No hay fotos en la galería todavía.</p>
      ) : (
        <div className={styles.grid}>
          {images.map((img) => (
            <div key={img.id} className={styles.item}>
              <img
                src={img.url.startsWith("/uploads") ? `/api${img.url}` : img.url}
                alt={img.caption ?? ""}
                className={styles.image}
                loading="lazy"
              />
              {img.caption && <p className={styles.caption}>{img.caption}</p>}
              <button className={styles.deleteBtn} onClick={() => handleDelete(img.id)}>
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
