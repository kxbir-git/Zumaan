import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string; // composite: productId-size-color
  productId: string;
  name: string;
  image: string;
  priceCents: number;
  size: string;
  color: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  add: (item: Omit<CartItem, "quantity" | "id"> & { quantity?: number }) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      add: (item) => {
        const id = `${item.productId}-${item.size}-${item.color}`;
        const existing = get().items.find((i) => i.id === id);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.id === id ? { ...i, quantity: i.quantity + (item.quantity ?? 1) } : i,
            ),
          });
        } else {
          set({ items: [...get().items, { ...item, id, quantity: item.quantity ?? 1 }] });
        }
        set({ isOpen: true });
      },
      remove: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
      setQty: (id, qty) =>
        set({
          items: get()
            .items.map((i) => (i.id === id ? { ...i, quantity: Math.max(1, qty) } : i))
            .filter((i) => i.quantity > 0),
        }),
      clear: () => set({ items: [] }),
      setOpen: (open) => set({ isOpen: open }),
      toggle: () => set({ isOpen: !get().isOpen }),
    }),
    { name: "neon-cart", partialize: (s) => ({ items: s.items }) },
  ),
);

export const cartTotalCents = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);
export const cartCount = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + i.quantity, 0);
