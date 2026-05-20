import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart, cartTotalCents, cartCount } from "@/lib/cart-store";
import { Link } from "@tanstack/react-router";

const fmt = (c: number) => `$${(c / 100).toFixed(2)}`;

export function CartDrawer() {
  const { items, isOpen, setOpen, remove, setQty } = useCart();
  const total = cartTotalCents(items);
  const count = cartCount(items);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
            className="fixed right-0 top-0 z-50 flex h-dvh w-full max-w-md flex-col border-l border-border bg-card"
          >
            <header className="flex items-center justify-between border-b border-border px-6 py-5">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-ember" />
                <h2 className="font-display text-lg font-bold tracking-tight">Your bag</h2>
                <span className="rounded-full bg-ember/15 px-2 py-0.5 text-xs font-medium text-ember">{count}</span>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-md p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
                  <div className="rounded-full bg-muted p-6">
                    <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="font-display text-lg">Your bag is empty</p>
                  <p className="text-sm text-muted-foreground">Pieces you love will land here.</p>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {items.map((i) => (
                    <motion.li
                      key={i.id}
                      layout
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40 }}
                      className="flex gap-4 px-6 py-4"
                    >
                      <div className="h-24 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                        {i.image && <img src={i.image} alt={i.name} className="h-full w-full object-cover" loading="lazy" />}
                      </div>
                      <div className="flex flex-1 flex-col">
                        <div className="flex justify-between gap-2">
                          <p className="font-medium leading-tight">{i.name}</p>
                          <button onClick={() => remove(i.id)} className="text-muted-foreground transition hover:text-ember">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="mt-0.5 text-xs uppercase tracking-wider text-muted-foreground">
                          {i.size} · {i.color}
                        </p>
                        <div className="mt-auto flex items-center justify-between">
                          <div className="inline-flex items-center rounded-full border border-border">
                            <button onClick={() => setQty(i.id, i.quantity - 1)} className="p-1.5 transition hover:text-ember"><Minus className="h-3 w-3" /></button>
                            <span className="w-7 text-center text-sm tabular-nums">{i.quantity}</span>
                            <button onClick={() => setQty(i.id, i.quantity + 1)} className="p-1.5 transition hover:text-ember"><Plus className="h-3 w-3" /></button>
                          </div>
                          <p className="font-display tabular-nums">{fmt(i.priceCents * i.quantity)}</p>
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <footer className="border-t border-border bg-background/40 px-6 py-5">
                <div className="mb-4 flex items-baseline justify-between">
                  <span className="text-sm uppercase tracking-widest text-muted-foreground">Subtotal</span>
                  <span className="font-display text-2xl font-bold tabular-nums">{fmt(total)}</span>
                </div>
                <Link
                  to="/"
                  onClick={() => setOpen(false)}
                  className="group relative flex w-full items-center justify-center overflow-hidden rounded-full bg-gradient-ember px-6 py-3.5 font-medium text-ember-foreground transition-all hover:scale-[1.01] hover:glow-ember"
                >
                  Checkout
                </Link>
                <p className="mt-2 text-center text-xs text-muted-foreground">Shipping & taxes calculated at checkout</p>
              </footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
