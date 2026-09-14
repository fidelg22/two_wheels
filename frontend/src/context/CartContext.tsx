import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { cart, type CartItem } from "@/lib/cart";
import type { Product } from "@/lib/api";

interface CartContextValue {
  items: CartItem[];
  count: number;
  total: number;
  add: (product: Product) => void;
  remove: (id: number) => void;
  setQuantity: (id: number, qty: number) => void;
  clear: () => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(cart.getItems());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => cart.subscribe(setItems), []);

  const value: CartContextValue = {
    items,
    count: items.reduce((s, i) => s + i.quantity, 0),
    total: items.reduce((s, i) => s + Number(i.product.price_pvp) * i.quantity, 0),
    add: (p) => { cart.add(p); },
    remove: cart.remove,
    setQuantity: cart.setQuantity,
    clear: cart.clear,
    isOpen,
    openCart: () => setIsOpen(true),
    closeCart: () => setIsOpen(false),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
