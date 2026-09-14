import type { CartItem } from "./cart";

const WHATSAPP_NUMBER = "593983345340";

export function buildWhatsAppURL(items: CartItem[], paymentMethod?: string): string {
  const lines: string[] = ["*Pedido Two Wheels World* 🏍️", ""];

  items.forEach(({ product, quantity }) => {
    const subtotal = (Number(product.price_pvp) * quantity).toFixed(2);
    lines.push(
      `▸ ${product.name}` +
      (product.measure ? ` (${product.measure})` : "") +
      `\n  Cant: ${quantity}  ×  $${Number(product.price_pvp).toFixed(2)}  =  *$${subtotal}*`
    );
  });

  const total = items
    .reduce((sum, { product, quantity }) => sum + Number(product.price_pvp) * quantity, 0)
    .toFixed(2);

  lines.push("", `*TOTAL: $${total}*`);
  if (paymentMethod) lines.push(`Tipo de pago: ${paymentMethod}`);
  lines.push("", "Por favor confirmar disponibilidad y coordinar entrega. ¡Gracias!");

  const text = encodeURIComponent(lines.join("\n"));
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}
