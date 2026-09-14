import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { buildWhatsAppURL } from "@/lib/whatsapp";
import styles from "./CartDrawer.module.css";

const PAYMENT_METHODS = ["Tarjeta de crédito", "Efectivo", "Transferencia"] as const;
type PaymentMethod = typeof PAYMENT_METHODS[number];

export default function CartDrawer() {
  const { items, count, total, remove, setQuantity, closeCart, isOpen, clear } = useCart();
  const [payment, setPayment] = useState<PaymentMethod | null>(null);

  if (!isOpen) return null;

  const handleWhatsApp = () => {
    if (items.length === 0) return;
    const url = buildWhatsAppURL(items, payment ?? undefined);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <div className={styles.backdrop} onClick={closeCart} />
      <aside className={styles.drawer}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Carrito <span className={styles.count}>{count}</span></h2>
            <p className={styles.headerSub}>Los pedidos se gestionan por WhatsApp</p>
          </div>
          <button className={styles.closeBtn} onClick={closeCart} aria-label="Cerrar carrito">
            <CloseIcon />
          </button>
        </div>

        {items.length === 0 ? (
          <div className={styles.empty}>
            <p>Tu carrito está vacío</p>
          </div>
        ) : (
          <>
            <ul className={styles.itemList}>
              {items.map(({ product, quantity }) => (
                <li key={product.id} className={styles.item}>
                  <div className={styles.itemImage}>
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} width={64} height={64} />
                    ) : (
                      <div className={styles.itemImagePlaceholder} />
                    )}
                  </div>
                  <div className={styles.itemInfo}>
                    <p className={styles.itemBrand}>{product.brand.name}</p>
                    <p className={styles.itemName}>{product.name}</p>
                    {product.measure && (
                      <span className={styles.itemMeasure}>{product.measure}</span>
                    )}
                    <p className={styles.itemPrice}>${Number(product.price_pvp).toFixed(2)}</p>
                  </div>
                  <div className={styles.itemActions}>
                    <div className={styles.qtyControl}>
                      <button
                        onClick={() => setQuantity(product.id, quantity - 1)}
                        aria-label={`Reducir cantidad de ${product.name}`}
                      >−</button>
                      <span>{quantity}</span>
                      <button
                        onClick={() => setQuantity(product.id, quantity + 1)}
                        aria-label={`Aumentar cantidad de ${product.name}`}
                      >+</button>
                    </div>
                    <button className={styles.removeBtn} onClick={() => remove(product.id)} aria-label={`Eliminar ${product.name}`}>
                      <TrashIcon />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className={styles.footer}>
              <div className={styles.totalRow}>
                <span>Total</span>
                <span className={styles.totalAmount}>${total.toFixed(2)}</span>
              </div>

              <div className={styles.paymentRow}>
                <span className={styles.paymentLabel}>Selecciona tu método de pago</span>
                <div className={styles.paymentBadges}>
                  <button
                    className={`${styles.paymentBadge} ${payment === "Tarjeta de crédito" ? styles.paymentBadgeActive : ""}`}
                    onClick={() => setPayment(p => p === "Tarjeta de crédito" ? null : "Tarjeta de crédito")}
                  ><CardIcon /><span>Tarjeta</span></button>
                  <button
                    className={`${styles.paymentBadge} ${payment === "Efectivo" ? styles.paymentBadgeActive : ""}`}
                    onClick={() => setPayment(p => p === "Efectivo" ? null : "Efectivo")}
                  ><CashIcon /><span>Efectivo</span></button>
                  <button
                    className={`${styles.paymentBadge} ${payment === "Transferencia" ? styles.paymentBadgeActive : ""}`}
                    onClick={() => setPayment(p => p === "Transferencia" ? null : "Transferencia")}
                  ><TransferIcon /><span>Transferencia</span></button>
                </div>
              </div>

              <button className={styles.whatsappBtn} onClick={handleWhatsApp} aria-label="Pedir por WhatsApp">
                <WhatsAppIcon />
                Pedir por WhatsApp
              </button>

              <button className={styles.clearBtn} onClick={clear}>
                Vaciar carrito
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

function CardIcon() {
  return (
    <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  );
}
function CashIcon() {
  return (
    <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="6" width="22" height="13" rx="2"/><circle cx="12" cy="12" r="3"/>
      <path d="M5 6V4M19 6V4M5 19v2M19 19v2"/>
    </svg>
  );
}
function TransferIcon() {
  return (
    <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
      <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" />
    </svg>
  );
}
function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.555 4.116 1.527 5.845L.057 23.938l6.241-1.634A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.797 9.797 0 0 1-5.002-1.368l-.36-.213-3.706.972.988-3.617-.234-.373A9.787 9.787 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z" />
    </svg>
  );
}
