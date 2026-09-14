import { useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { resolveImageUrl, type Product } from "@/lib/api";
import ProductPlaceholder from "./ProductPlaceholder";
import styles from "./ProductCard.module.css";

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const { add }    = useCart();
  const navigate   = useNavigate();

  const displayPrice = product.is_promo && product.promo_price
    ? Number(product.promo_price)
    : Number(product.price_pvp);

  return (
    <article
      className={styles.card}
      onClick={() => navigate(`/producto/${product.id}`)}
      style={{ cursor: "pointer" }}
    >
      {/* Image */}
      <div className={styles.imageWrap}>
        {resolveImageUrl(product.image_url) ? (
          <img
            src={resolveImageUrl(product.image_url)!}
            alt={product.name}
            className={styles.image}
            loading="lazy"
          />
        ) : (
          <ProductPlaceholder product={product} />
        )}
        {product.is_promo && (
          <span className={styles.promoBadge}>OFERTA</span>
        )}
        {product.position && product.position !== "ambas" && (
          <span className={styles.positionBadge}>{product.position}</span>
        )}
      </div>

      {/* Body */}
      <div className={styles.body}>
        <p className={styles.brand}>{product.brand.name}</p>
        <h3 className={styles.name}>{product.name}</h3>

        <div className={styles.tags}>
          {product.measure && (
            <span className={styles.measureTag}>{product.measure}</span>
          )}
          {product.application && (
            <span className={styles.appTag}>{product.application}</span>
          )}
        </div>

        {/* Price row */}
        <div className={styles.priceRow}>
          <div className={styles.priceBlock}>
            {product.is_promo && product.promo_price ? (
              <>
                <span className={styles.originalPrice}>
                  ${Number(product.price_pvp).toFixed(2)}
                </span>
                <span className={styles.promoPrice}>
                  ${Number(product.promo_price).toFixed(2)}
                </span>
              </>
            ) : (
              <span className={styles.price}>
                ${displayPrice.toFixed(2)}
              </span>
            )}
          </div>
          <button
            className={styles.cartBtn}
            onClick={(e) => { e.stopPropagation(); add(product); }}
            aria-label={`Agregar ${product.name} al carrito`}
            title="Agregar al carrito"
          >
            <PlusIcon />
          </button>
        </div>

      </div>
    </article>
  );
}


function PlusIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}

