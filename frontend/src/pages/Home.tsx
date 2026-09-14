import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import ProductCard from "@/components/ProductCard";
import { api, resolveImageUrl, type Product, type Category, type Brand, type GalleryImage } from "@/lib/api";
import styles from "./Home.module.css";

const TIRE_ITEMS = [
  { img: "/slide/40050341.png", name: "DIABLO ROSSO IV",      tag: "SUPER SPORT",            segment: "super-sport"     },
  { img: "/slide/40050357.png", name: "DIABLO SUPERCORSA SP", tag: "TRACK 90% · ROAD 10%",   segment: "pista"           },
  { img: "/slide/40050278.png", name: "SCORPION RALLY STR",   tag: "DUAL 60% · ROAD 40% OFF",segment: "doble-proposito" },
];

const TIRE_SEGMENT_SLUGS = new Set([
  "ciudad", "sport-touring", "super-sport",
  "doble-proposito", "pista", "cross", "road-sport",
]);

const CAT_IMAGES: Record<string, string> = {
  "llantas":             "/llanta.jpg",
  "aceites-y-lubricantes": "/aceite.png",
  "pastillas-de-freno":  "/pastillas.png",
};

// Logos locales de respaldo para marcas ya conocidas sin image_url en la BD.
// Las marcas nuevas creadas desde el admin usan la imagen que se les suba ahí,
// o si no tienen ninguna, un tile con sus iniciales (ver BrandLogoTile).
const LOCAL_BRAND_LOGOS: Record<string, string> = {
  michelin:    "/brands/michelin.png",
  continental: "/brands/continental.png",
  pirelli:     "/brands/pirelli.png",
  metzeler:    "/brands/metzeler.png",
  dunlop:      "/brands/dunlop.png",
  mitas:       "/brands/mitas.png",
  kenda:       "/brands/kenda.png",
  timsun:      "/brands/timsun.jpg",
  maggion:     "/brands/maggion.png",
  wolver:      "/brands/wolver.png",
  motortec:    "/brands/motortec.jpg",
  repsol:      "/brands/repsol.png",
  mannol:      "/brands/mannol.jpg",
  ebc:         "/brands/ebc.png",
  moxal:       "/brands/moxal.jpg",
  cbi:         "/brands/cbi.jpg",
};

// Prioridad de orden para las categorías "de siempre" en el Home; cualquier
// categoría nueva (Cadenas, Indumentaria, etc.) que no esté aquí se agrega
// al final, ordenada alfabéticamente entre ellas.
const CATEGORY_ORDER_PRIORITY: Record<string, number> = {
  "llantas": 0,
  "aceites-y-lubricantes": 1,
  "pastillas-de-freno": 2,
};

const TALLER_PREV = [
  { service: "Cambio de Aceite & Filtro",     price: "$35" },
  { service: "Ajuste & Lubricación de Cadena", price: "$15" },
  { service: "Revisión de Frenos & Fluidos",  price: "$20" },
  { service: "Sincronización Básica",         price: "$50" },
];
const TALLER_CORR = [
  { service: "Diagnóstico Sistema Eléctrico", price: "$45"    },
  { service: "Reconstrucción de Suspensión",  price: "$100"   },
  { service: "Cambio de Embrague / Discos",   price: "$75"    },
  { service: "Reparación Integral de Motor",  price: "Cotizar"},
];

export default function Home() {
  const [promos, setPromos]         = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brandsByCat, setBrandsByCat] = useState<Record<string, Brand[]>>({});
  const [gallery, setGallery]       = useState<GalleryImage[]>([]);
  const [carouselIdx, setCarouselIdx] = useState(0);

  useEffect(() => {
    api.getPromos().then(setPromos).catch(() => {});
    api.getCategories().then(setCategories).catch(() => {});
    api.getGallery().then(setGallery).catch(() => {});
  }, []);

  useEffect(() => {
    if (categories.length === 0) return;
    // Marcas activas por categoría — solo las que tienen productos en stock,
    // así cualquier categoría/marca nueva creada desde el admin aparece sola
    // (sin tocar código) apenas tenga un producto activo publicado.
    Promise.all(categories.map((c) => api.getBrands(c.slug)))
      .then((lists) => {
        setBrandsByCat(
          Object.fromEntries(categories.map((c, i) => [c.slug, lists[i]]))
        );
      })
      .catch(() => {});
  }, [categories]);

  const brandCategoryGroups = [...categories].sort((a, b) => {
    const pa = CATEGORY_ORDER_PRIORITY[a.slug] ?? 99;
    const pb = CATEGORY_ORDER_PRIORITY[b.slug] ?? 99;
    return pa !== pb ? pa - pb : a.name.localeCompare(b.name);
  });

  // Lookup helper: prefer image_url de la categoría, fallback al mapa estático
  const catImgMap = Object.fromEntries(
    categories.filter(c => c.image_url).map(c => [c.slug, c.image_url as string])
  );
  const catImg = (slug: string) =>
    catImgMap[slug] ?? CAT_IMAGES[slug] ?? "";

  const prevTire = useCallback(() =>
    setCarouselIdx(i => (i - 1 + TIRE_ITEMS.length) % TIRE_ITEMS.length), []);
  const nextTire = useCallback(() =>
    setCarouselIdx(i => (i + 1) % TIRE_ITEMS.length), []);

  useEffect(() => {
    const id = setInterval(nextTire, 2500);
    return () => clearInterval(id);
  }, [nextTire]);

  function getTireClass(index: number) {
    const len  = TIRE_ITEMS.length;
    const diff = ((index - carouselIdx) + len) % len;
    if (diff === 0) return styles.tireCenter;
    if (diff === 1) return styles.tireRight;
    return styles.tireLeft;
  }

  return (
    <main className={styles.main}>

      {/* ══════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════ */}
      <section className={styles.hero} id="hero">
        <div className={styles.heroInner}>
          {/* ── Left: copy ── */}
          <div className={styles.heroContent}>
            <p className={styles.heroEyebrow}>Tu lugar de confianza</p>
            <h1 className={styles.heroTitle}>
              DOMINA<br />
              EL <span className={styles.heroAccent}>ASFALTO</span>
            </h1>
            <div className={styles.heroActions}>
              <Link to="/catalogo" className={`btn ${styles.btnSkew}`}>Explorar</Link>
              <div className={styles.carouselBtns}>
                <button className={styles.carouselBtn} onClick={prevTire} aria-label="Anterior">
                  <ArrowLeftIcon />
                </button>
                <button className={styles.carouselBtn} onClick={nextTire} aria-label="Siguiente">
                  <ArrowRightIcon />
                </button>
              </div>
            </div>
          </div>

          {/* ── Right: tire carousel ── */}
          <div className={styles.carouselArea}>
            <div className={styles.carouselTrack}>
              {TIRE_ITEMS.map((tire, i) => {
                const isCenter = i === carouselIdx;
                const content = <img src={tire.img} alt={tire.tag} draggable={false} />;
                return (
                  <div key={i} className={`${styles.tireItem} ${getTireClass(i)}`}>
                    {isCenter ? (
                      <Link
                        to={`/catalogo/llantas?segment=${tire.segment}`}
                        className={styles.tireLink}
                        title={`Ver llantas ${tire.tag}`}
                      >
                        {content}
                      </Link>
                    ) : content}
                  </div>
                );
              })}
            </div>
            <div className={styles.carouselInfo}>
              <span className={styles.carouselName}>{TIRE_ITEMS[carouselIdx].name}</span>
              <span className={styles.carouselTag}>{TIRE_ITEMS[carouselIdx].tag}</span>
            </div>
          </div>
        </div>

        <div className={styles.heroScroll}>
          <div className={styles.scrollLine} />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          STATS BAR
      ══════════════════════════════════════════════════ */}
      <div className={styles.statsBar}>
        <div className={styles.statsInner}>
          <Reveal type="up" className={styles.stat}><Stat num="330+" label="Productos" /></Reveal>
          <div className={styles.statDivider} aria-hidden="true" />
          <Reveal type="up" delay={200} className={styles.stat}><Stat num="10+" label="Marcas" /></Reveal>
          <div className={styles.statDivider} aria-hidden="true" />
          <Reveal type="up" delay={300} className={styles.stat}><Stat num="5" label="Años" /></Reveal>
          <div className={styles.statDivider} aria-hidden="true" />
          <Reveal type="up" delay={400} className={styles.stat}><Stat num="Quito" label="Ecuador" /></Reveal>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          CATEGORÍAS — editorial image cards
      ══════════════════════════════════════════════════ */}
      {categories.length > 0 && (
        <section className={styles.catSection} id="categorias">
          <Reveal className="container" type="up">
            <p className={styles.eyebrow}>Nuestro Catálogo</p>
            <h2 className={styles.sectionTitle}>
              Explora <span className={styles.accentWord}>Categorías</span>
            </h2>
          </Reveal>
          <div className={styles.catGrid}>
            {[...categories]
              .sort((a, b) => (a.slug === "llantas" ? -1 : b.slug === "llantas" ? 1 : 0))
              .map((cat, i) => (
              <Link
                key={cat.id}
                to={
                  TIRE_SEGMENT_SLUGS.has(cat.slug)
                    ? `/catalogo/llantas?segment=${cat.slug}`
                    : `/catalogo/${cat.slug}`
                }
                className={styles.catCard}
              >
                <div
                  className={`${styles.catBg} ${styles[`catBg${i % 4}`]}`}
                  style={catImg(cat.slug) ? {
                    backgroundImage: `url(${catImg(cat.slug)})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  } : undefined}
                >
                  {!catImg(cat.slug) && (
                    <span className={styles.catGhost}>{cat.name.charAt(0)}</span>
                  )}
                </div>
                <div className={styles.catOverlay} />
                <div className={styles.catCardContent}>
                  <h3 className={styles.catName}>{cat.name}</h3>
                  <div className={styles.catLine} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════
          PROMOCIONES — editorial cards
      ══════════════════════════════════════════════════ */}
      {promos.length > 0 && (
        <section className={styles.promoSection} id="promociones">
          <div className="container">
            <Reveal type="up" className={styles.promoHeader}>
              <div>
                <h2 className={styles.sectionTitle}>
                  PROMOCIONES <span className={styles.accentWord}>EXCLUSIVAS</span>
                </h2>
                <p className={styles.promoSubtitle}>
                  Ofertas por tiempo limitado en las mejores marcas internacionales.
                </p>
              </div>
              <Link to="/catalogo?is_promo=true" className={styles.seeAll}>
                Ver todas →
              </Link>
            </Reveal>
            <div className={styles.promoGrid}>
              {promos.slice(0, 2).map((p) => (
                <div key={p.id} className={styles.promoCard}>
                  {p.image_url ? (
                    <div
                      className={styles.promoCardBg}
                      style={{
                        backgroundImage: `url(${p.image_url.startsWith("/uploads") ? `/api${p.image_url}` : p.image_url})`,
                      }}
                    />
                  ) : (
                    <div className={styles.promoCardBgFallback} />
                  )}
                  <div className={styles.promoCardOverlay} />
                  <div className={styles.promoCardContent}>
                    <span className={styles.promoBadge}>
                      {p.promo_ends_at ? "Oferta limitada" : "PROMO"}
                    </span>
                    <h3 className={styles.promoCardTitle}>{p.name}</h3>
                    <p className={styles.promoCardBrand}>{p.brand.name}</p>
                    <div className={styles.promoCardPrice}>
                      {p.promo_price && (
                        <>
                          <span className={styles.promoOldPrice}>${p.price_pvp.toFixed(2)}</span>
                          <span className={styles.promoNewPrice}>${p.promo_price.toFixed(2)}</span>
                        </>
                      )}
                    </div>
                    <a
                      href={`https://wa.me/593983345340?text=${encodeURIComponent(`Hola, me interesa el producto: ${p.name}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.promoCardBtn}
                    >
                      Ver Promoción
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════
          PRODUCTOS DESTACADOS — horizontal scroll
      ══════════════════════════════════════════════════ */}
      {promos.length > 0 && (
        <section className={styles.featuredSection}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                PRODUCTOS <span className={styles.accentWord}>DESTACADOS</span>
              </h2>
              <Link to="/catalogo" className={styles.seeAll}>
                Ver Todo →
              </Link>
            </div>
          </div>
          <div className={styles.featuredScroll}>
            {promos.slice(0, 6).map((p) => (
              <div key={p.id} className={styles.featuredCardWrap}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════
          MARCAS — logo grid por categoría
      ══════════════════════════════════════════════════ */}
      <section className={styles.brandsSection}>
        <div className="container">
          <Reveal type="up">
            <p className={styles.eyebrow}>Distribuidores Oficiales</p>
            <h2 className={styles.sectionTitle}>
              Las mejores <span className={styles.accentWord}>Marcas</span>
            </h2>
            <p className={styles.brandsSub}>
              Trabajamos directamente con los fabricantes líderes del mundo para garantizarte producto original y rendimiento certificado.
            </p>
          </Reveal>

          <div className={styles.brandsGroups}>
            {brandCategoryGroups.map((c) => {
              const list = brandsByCat[c.slug];
              if (!list || list.length === 0) return null;
              return (
                <div className={styles.brandsGroup} key={c.slug}>
                  <p className={styles.brandsGroupLabel}>{c.name}</p>
                  <div className={styles.brandsGrid}>
                    {list.map((b) => (
                      <BrandLogoTile
                        key={b.id}
                        brand={b}
                        to={`/catalogo/${c.slug}?brand=${b.slug}`}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          TALLER — servicios técnicos
      ══════════════════════════════════════════════════ */}
      <section className={styles.tallerSection} id="taller">
        <div className="container">
          <Reveal type="up" className={styles.tallerHeader}>
            <p className={styles.eyebrow}>Servicio Técnico</p>
            <h2 className={styles.sectionTitle}>
              Mantenimiento <span className={styles.accentWord}>Especializado</span>
            </h2>
            <p className={styles.tallerSubtitle}>
              Ingeniería de precisión para tu máquina. Especialistas en alta cilindrada.
            </p>
          </Reveal>

          <div className={styles.tallerGrid}>
            {/* Preventivo */}
            <Reveal type="left" className={styles.tallerCard}>
              <div className={styles.tallerNum}>01</div>
              <div className={styles.tallerCardInner}>
                <h3 className={styles.tallerCardTitle}>Mantenimiento Preventivo</h3>
                <div className={styles.tallerList}>
                  {TALLER_PREV.map((item, i) => (
                    <div key={i} className={styles.tallerRow}>
                      <span className={styles.tallerService}>{item.service}</span>
                      <span className={styles.tallerPrice}>{item.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Correctivo */}
            <Reveal type="right" delay={200} className={`${styles.tallerCard} ${styles.tallerCardAlt}`}>
              <div className={styles.tallerNum}>02</div>
              <div className={styles.tallerCardInner}>
                <h3 className={`${styles.tallerCardTitle} ${styles.tallerCardTitleAlt}`}>
                  Mantenimiento Correctivo
                </h3>
                <div className={styles.tallerList}>
                  {TALLER_CORR.map((item, i) => (
                    <div key={i} className={styles.tallerRow}>
                      <span className={styles.tallerService}>{item.service}</span>
                      <span className={`${styles.tallerPrice} ${styles.tallerPriceAlt}`}>
                        {item.price}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          GALLERY
      ══════════════════════════════════════════════════ */}
      {gallery.length > 0 && (
        <section className={styles.section}>
          <div className="container">
            <h2 className={styles.sectionTitle}>EXPERIENCIAS</h2>
            <p className={styles.sectionSubtitle}>
              Clientes, motos y trabajos que nos definen.
            </p>
            <div className={styles.galleryMosaic}>
              {gallery.slice(0, 9).map((img, i) => (
                <div
                  key={img.id}
                  className={`${styles.galleryItem} ${styles[`galleryItem${(i % 5) + 1}`]}`}
                >
                  <img
                    src={img.url.startsWith("/uploads") ? `/api${img.url}` : img.url}
                    alt={img.caption ?? "Experiencia Two Wheels"}
                    loading="lazy"
                  />
                  {img.caption && (
                    <p className={styles.galleryCaption}>{img.caption}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════
          WHATSAPP CTA
      ══════════════════════════════════════════════════ */}
      <section className={styles.ctaSection}>
        <div className="container">
          <Reveal type="scale" className={styles.ctaBox}>
            <p className={styles.eyebrow}>Atención directa</p>
            <h2 className={styles.ctaTitle}>¿TIENES DUDAS?</h2>
            <p className={styles.ctaText}>
              Escríbenos directamente y te asesoramos sin compromiso.
            </p>
            <a
              href="https://wa.me/593983345340"
              target="_blank"
              rel="noopener noreferrer"
              className={`btn ${styles.ctaBtn} ${styles.btnSkew}`}
            >
              <WhatsAppIcon />
              Escríbenos por WhatsApp
            </a>

            <div className={styles.paymentRow}>
              <span className={styles.paymentLabel}>Aceptamos</span>
              <div className={styles.paymentBadges}>
                <div className={styles.paymentBadge}>
                  <CardIcon />
                  <span>Tarjeta</span>
                </div>
                <div className={styles.paymentBadge}>
                  <CashIcon />
                  <span>Efectivo</span>
                </div>
                <div className={styles.paymentBadge}>
                  <TransferIcon />
                  <span>Transferencia</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

    </main>
  );
}

/* ── Scroll reveal hook ────────────────────────────── */
function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  type?: "up" | "fade" | "left" | "right" | "scale";
}
function Reveal({ children, className = "", delay, type = "up" }: RevealProps) {
  const typeClass = {
    up: styles.reveal, fade: styles.revealFade,
    left: styles.revealLeft, right: styles.revealRight, scale: styles.revealScale,
  }[type];
  const { ref, visible } = useReveal(0.1);
  const delayClass = delay ? styles[`d${delay}` as keyof typeof styles] : "";
  return (
    <div
      ref={ref as React.Ref<HTMLDivElement>}
      className={[typeClass, visible ? styles.revealed : "", delayClass, className].filter(Boolean).join(" ")}
    >
      {children}
    </div>
  );
}

/* ── Micro-components ──────────────────────────────── */

function BrandLogoTile({ brand, to }: { brand: Brand; to: string }) {
  const [broken, setBroken] = useState(false);
  const src = broken ? null : resolveImageUrl(brand.image_url) ?? LOCAL_BRAND_LOGOS[brand.slug];

  return (
    <Link to={to} className={styles.brandLogo} title={`Ver ${brand.name}`}>
      {src ? (
        <img src={src} alt={brand.name} draggable={false} onError={() => setBroken(true)} />
      ) : (
        <span className={styles.brandLogoFallback}>{brand.name}</span>
      )}
    </Link>
  );
}

function Stat({ num, label }: { num: string; label: string }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statNum}>{num}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}

function ArrowLeftIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}



function CardIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
      <line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  );
}
function CashIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="6" width="22" height="13" rx="2"/>
      <circle cx="12" cy="12" r="3"/>
      <path d="M5 6V4M19 6V4M5 19v2M19 19v2"/>
    </svg>
  );
}
function TransferIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9"/>
      <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
      <polyline points="7 23 3 19 7 15"/>
      <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
    </svg>
  );
}
function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.123.555 4.116 1.527 5.845L.057 23.938l6.241-1.634A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.797 9.797 0 0 1-5.002-1.368l-.36-.213-3.706.972.988-3.617-.234-.373A9.787 9.787 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z" />
    </svg>
  );
}
