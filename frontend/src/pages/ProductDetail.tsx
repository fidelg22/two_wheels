import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api, resolveImageUrl, type Product } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import ProductCard from "@/components/ProductCard";
import ProductPlaceholder from "@/components/ProductPlaceholder";
import styles from "./ProductDetail.module.css";

const SEGMENT_MAP: [string, string][] = [
  ["super sport",  "super-sport"],
  ["ciudad",       "ciudad"],
  ["sport",        "sport-touring"],
  ["dual",         "doble-proposito"],
  ["track",        "pista"],
  ["cross",        "cross"],
  ["road sport",   "road-sport"],
];

const TIRE_SLUGS = new Set([
  "llantas", "ciudad", "sport-touring", "super-sport",
  "doble-proposito", "pista", "cross", "road-sport",
]);

function getSegment(application: string | null): string | null {
  if (!application) return null;
  const lower = application.toLowerCase().trim();
  for (const [prefix, slug] of SEGMENT_MAP) {
    if (lower.startsWith(prefix)) return slug;
  }
  return null;
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { add } = useCart();
  const navigate = useNavigate();

  const [product, setProduct]       = useState<Product | null>(null);
  const [loading, setLoading]       = useState(true);
  const [notFound, setNotFound]     = useState(false);
  const [qty, setQty]               = useState(1);
  const [lightboxOpen, setLightbox] = useState(false);
  const [related, setRelated]       = useState<Product[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setNotFound(false);
    setProduct(null);
    setRelated([]);
    setQty(1);
    api.getProduct(Number(id))
      .then(setProduct)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!product) return;
    const cat     = product.category.slug;
    const isTire  = TIRE_SLUGS.has(cat);

    const load = async () => {
      try {
        let items: Product[] = [];
        if (isTire) {
          const segment = getSegment(product.application);
          if (segment) {
            const res = await api.getProducts({ category: "llantas", segment, per_page: 9 });
            items = res.items.filter(p => p.id !== product.id);
          }
          if (items.length < 4) {
            const res = await api.getProducts({ category: "llantas", per_page: 12 });
            const extra = res.items.filter(p => p.id !== product.id && !items.some(r => r.id === p.id));
            items = [...items, ...extra];
          }
        } else {
          const res = await api.getProducts({ category: cat, per_page: 9 });
          items = res.items.filter(p => p.id !== product.id);
        }
        setRelated(items.slice(0, 8));
      } catch {
        setRelated([]);
      }
    };
    load();
  }, [product]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setLightbox(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxOpen]);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "right" ? 280 : -280, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className={styles.notFound}>
        <h2>Producto no encontrado</h2>
        <p>Este producto no existe o ya no está disponible.</p>
        <button className="btn" onClick={() => navigate("/catalogo")}>Ver catálogo</button>
      </div>
    );
  }

  const inStock  = product.stock > 0;
  const imageUrl = resolveImageUrl(product.image_url);

  const displayPrice = product.is_promo && product.promo_price
    ? Number(product.promo_price)
    : Number(product.price_pvp);

  const shareUrl = window.location.href;
  const waText   = encodeURIComponent(`Mira este producto: ${product.name} - ${shareUrl}`);

  const isTireCat     = TIRE_SLUGS.has(product.category.slug);
  const catLink       = isTireCat ? "/catalogo/llantas" : `/catalogo/${product.category.slug}`;
  const catLabelCrumb = isTireCat ? "Llantas" : product.category.name;

  return (
    <main className={styles.main}>

      {/* Breadcrumb */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link to="/"         className={styles.breadcrumbLink}>Inicio</Link>
        <span className={styles.breadcrumbSep}>/</span>
        <Link to="/catalogo" className={styles.breadcrumbLink}>Catálogo</Link>
        <span className={styles.breadcrumbSep}>/</span>
        <Link to={catLink}   className={styles.breadcrumbLink}>{catLabelCrumb}</Link>
        <span className={styles.breadcrumbSep}>/</span>
        <span className={styles.breadcrumbCurrent}>{product.name}</span>
      </nav>

      {/* Two-column product block */}
      <div className={styles.product}>

        {/* Left — image */}
        <div>
          <div className={styles.imageWrap}>
            {imageUrl ? (
              <img src={imageUrl} alt={product.name} className={styles.productImage} />
            ) : (
              <ProductPlaceholder product={product} />
            )}
            {imageUrl && (
              <button
                className={styles.zoomBtn}
                onClick={() => setLightbox(true)}
                aria-label="Ampliar imagen"
              >
                <ZoomIcon />
              </button>
            )}
          </div>
        </div>

        {/* Right — info */}
        <div className={styles.infoCol}>
          <p className={styles.brandLabel}>{product.brand.name}</p>
          <h1 className={styles.title}>{product.name}</h1>
          {product.sku && <p className={styles.sku}>SKU: {product.sku}</p>}

          <div className={styles.divider} />

          <div className={styles.priceRow}>
            {product.is_promo && product.promo_price ? (
              <>
                <span className={styles.priceOriginal}>${Number(product.price_pvp).toFixed(2)}</span>
                <span className={styles.price}>${displayPrice.toFixed(2)}</span>
                <span className={styles.promoBadge}>OFERTA</span>
              </>
            ) : (
              <span className={styles.price}>${displayPrice.toFixed(2)}</span>
            )}
          </div>

          <span className={`${styles.stockBadge} ${inStock ? styles.available : styles.out}`}>
            <DotIcon /> {inStock ? "Disponible" : "Agotado"}
          </span>

          <div className={styles.divider} />

          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
            Marca: <strong style={{ color: "var(--color-text)" }}>{product.brand.name}</strong>
          </p>

          <div className={styles.actions}>
            <div className={styles.qtyRow}>
              <button
                className={styles.qtyBtn}
                onClick={() => setQty(q => Math.max(1, q - 1))}
                disabled={!inStock}
                aria-label="Menos"
              >−</button>
              <span className={styles.qtyValue}>{qty}</span>
              <button
                className={styles.qtyBtn}
                onClick={() => setQty(q => q + 1)}
                disabled={!inStock}
                aria-label="Más"
              >+</button>
            </div>

            <button
              className={styles.addToCart}
              disabled={!inStock}
              onClick={() => { for (let i = 0; i < qty; i++) add(product); }}
            >
              <CartIcon /> {inStock ? "Añadir al carrito" : "Agotado"}
            </button>
          </div>

          <a
            href={`https://wa.me/593983345340?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.waShare}
          >
            <WhatsAppIcon /> Compartir por WhatsApp
          </a>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && imageUrl && (
        <div className={styles.lightbox} onClick={() => setLightbox(false)}>
          <div className={styles.lightboxContent} onClick={e => e.stopPropagation()}>
            <button
              className={styles.lightboxClose}
              onClick={() => setLightbox(false)}
              aria-label="Cerrar"
            >
              <CloseIcon />
            </button>
            <img src={imageUrl} alt={product.name} className={styles.lightboxImage} />
          </div>
        </div>
      )}

      {/* Related products */}
      {related.length > 0 && (
        <section className={styles.related}>
          <h2 className={styles.relatedTitle}>
            TAMBIÉN TE PUEDE <span className={styles.accent}>INTERESAR</span>
          </h2>
          <div className={styles.carouselWrap}>
            <button
              className={`${styles.carouselArrow} ${styles.arrowLeft}`}
              onClick={() => scroll("left")}
              aria-label="Anterior"
            >
              <ChevronLeft />
            </button>

            <div className={styles.carousel} ref={scrollRef}>
              {related.map(p => (
                <div key={p.id} className={styles.carouselCard}>
                  <ProductCard product={p} />
                </div>
              ))}
            </div>

            <button
              className={`${styles.carouselArrow} ${styles.arrowRight}`}
              onClick={() => scroll("right")}
              aria-label="Siguiente"
            >
              <ChevronRight />
            </button>
          </div>
        </section>
      )}
    </main>
  );
}

/* ── Icons ──────────────────────────────────────────────── */
function ZoomIcon() {
  return (
    <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
    </svg>
  );
}
function CartIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
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
function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.123.555 4.116 1.527 5.845L.057 23.938l6.241-1.634A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.797 9.797 0 0 1-5.002-1.368l-.36-.213-3.706.972.988-3.617-.234-.373A9.787 9.787 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
    </svg>
  );
}
function DotIcon() {
  return <span style={{ width: 8, height: 8, borderRadius: "50%", background: "currentColor", display: "inline-block", flexShrink: 0 }} />;
}
function ChevronLeft() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  );
}
function ChevronRight() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}
