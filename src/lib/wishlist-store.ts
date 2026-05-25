import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { listWishlist, toggleWishlist } from "./wishlist.functions";

interface WishlistState {
  ids: Set<string>;
  loaded: boolean;
  hydrate: () => Promise<void>;
  clear: () => void;
  toggle: (productId: string) => Promise<{ saved: boolean }>;
  has: (productId: string) => boolean;
}

export const useWishlist = create<WishlistState>((set, get) => ({
  ids: new Set(),
  loaded: false,
  hydrate: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      set({ ids: new Set(), loaded: true });
      return;
    }
    try {
      const ids = await listWishlist();
      set({ ids: new Set(ids), loaded: true });
    } catch {
      set({ ids: new Set(), loaded: true });
    }
  },
  clear: () => set({ ids: new Set(), loaded: false }),
  toggle: async (productId) => {
    const res = await toggleWishlist({ data: { productId } });
    const next = new Set(get().ids);
    if (res.saved) next.add(productId);
    else next.delete(productId);
    set({ ids: next });
    return res;
  },
  has: (productId) => get().ids.has(productId),
}));
