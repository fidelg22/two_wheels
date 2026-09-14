import type { Product } from "./api";

export interface CartItem {
  product: Product;
  quantity: number;
}

const STORAGE_KEY = "tww_cart";

function load(): CartItem[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function save(items: CartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

type Listener = (items: CartItem[]) => void;
const listeners = new Set<Listener>();

let _items: CartItem[] = load();

function notify() {
  listeners.forEach((fn) => fn([..._items]));
}

export const cart = {
  getItems: (): CartItem[] => [..._items],

  subscribe: (fn: Listener): (() => void) => {
    listeners.add(fn);
    fn([..._items]);
    return () => listeners.delete(fn);
  },

  add: (product: Product) => {
    const existing = _items.find((i) => i.product.id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      _items.push({ product, quantity: 1 });
    }
    save(_items);
    notify();
  },

  remove: (productId: number) => {
    _items = _items.filter((i) => i.product.id !== productId);
    save(_items);
    notify();
  },

  setQuantity: (productId: number, quantity: number) => {
    if (quantity <= 0) {
      cart.remove(productId);
      return;
    }
    const item = _items.find((i) => i.product.id === productId);
    if (item) {
      item.quantity = quantity;
      save(_items);
      notify();
    }
  },

  clear: () => {
    _items = [];
    save(_items);
    notify();
  },

  total: (): number =>
    _items.reduce((sum, i) => sum + Number(i.product.price_pvp) * i.quantity, 0),

  count: (): number => _items.reduce((sum, i) => sum + i.quantity, 0),
};
