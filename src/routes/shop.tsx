import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpDown, Filter, Plus, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { CATEGORIES, PRODUCTS, fmtPrice, type Product } from "@/lib/products";
import { useCart } from "@/lib/cart-store";

export const Route = createFileRoute("/shop")({
  component: ShopPage,
  head: () => ({
    meta: [
      { title: "Shop — NEONFIT 2027 Drop" },
      { name: "description", content: "Browse the full NEONFIT 2027 catalog. Techwear, oversized cuts, limited drops." },
      { property: "og:title", content: "Shop — NEONFIT 2027" },
      { property: "og:description", content: "Browse the full NEONFIT 2027 catalog." },
    ],
  }),
});

type Sort = "featured" | "price-asc" | "price-desc" | "newest";

const SORTS: { value: Sort; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price · Low → High" },
  { value: "price-desc", label: "Price · High → Low" },
];

function ShopCard({ p, idx }: { p: Product; idx: number }) {
  const add = useCart((s) => s.add);
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, delay: Math.min(idx, 8) * 0.04 }}
      className="group relative"
    >
      <Link to="/shop/$productId" params={{ productId: p.id }} className="block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-muted">
          <img
            src={p.image}
            alt={p.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <span className="absolute left-3 top-3 rounded-full bg-background/80 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-ember backdrop-blur">
            {p.tag}
          </span>
        </div>
      </Link>

      <button
        onClick={() =>
          add({
            productId: p.id,
            name: p.name,
            image: p.image,
            priceCents: p.price,
            size: p.sizes[Math.floor(p.sizes.length / 2)],
            color: p.colors[0],
          })
        }
        className="absolute right-4 top-[calc(100%-3.5rem-1rem)] grid h-11 w-11 translate-y-2 place-items-center rounded-full bg-gradient-ember text-ember-foreground opacity-0 shadow-lg transition-all duration-300 hover:scale-110 hover:glow-ember group-hover:translate-y-0 group-hover:opacity-100"
        aria-label={`Quick add ${p.name}`}
      >
        <Plus className="h-5 w-5" />
      </button>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{p.category}</p>
          <h3 className="mt-0.5 font-display text-sm font-bold tracking-tight">{p.name}</h3>
        </div>
        <p className="font-display text-sm font-bold tabular-nums">{fmtPrice(p.price)}</p>
      </div>
    </motion.article>
  );
}

function ShopPage() {
  const [active, setActive] = useState<(typeof CATEGORIES)[number]>("All");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("featured");
  const [maxPrice, setMaxPrice] = useState(30000);

  const filtered = useMemo(() => {
    let list = PRODUCTS.filter((p) => (active === "All" ? true : p.category === active));
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    list = list.filter((p) => p.price <= maxPrice);
    switch (sort) {
      case "price-asc":
        list = [...list].sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list = [...list].sort((a, b) => b.price - a.price);
        break;
      case "newest":
        list = [...list].sort((a, b) => (a.tag === "NEW" ? -1 : 1) - (b.tag === "NEW" ? -1 : 1));
        break;
    }
    return list;
  }, [active, query, sort, maxPrice]);

  return (
    <div className="min-h-dvh">
      {/* Heading */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-noir">
        <div className="pointer-events-none absolute -left-32 top-1/2 h-[480px] w-[480px] -translate-y-1/2 rounded-full bg-ember/15 blur-[120px]" />
        <div className="relative mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
          <motion.p
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="font-mono text-xs uppercase tracking-[0.3em] text-ember"
          >
            Catalog · Drop 04
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="mt-4 font-display text-5xl font-black tracking-tighter sm:text-7xl"
          >
            Every <span className="text-gradient-ember">piece</span>.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
            className="mt-4 max-w-xl text-muted-foreground"
          >
            {PRODUCTS.length} items · Filter by category, price, and search. Limited runs restock rarely.
          </motion.p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Category pills */}
          <div className="-mx-1 flex flex-1 gap-2 overflow-x-auto px-1 scrollbar-hide">
            {CATEGORIES.map((c) => {
              const isActive = c === active;
              return (
                <button
                  key={c}
                  onClick={() => setActive(c)}
                  className="relative shrink-0 rounded-full border border-border px-4 py-2 text-sm font-medium transition"
                >
                  {isActive && (
                    <motion.span
                      layoutId="shop-pill"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                      className="absolute inset-0 -z-10 rounded-full bg-gradient-ember glow-ember"
                    />
                  )}
                  <span className={isActive ? "text-ember-foreground" : "text-foreground"}>{c}</span>
                </button>
              );
            })}
          </div>

          {/* Search + sort */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 lg:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search drops…"
                className="h-10 w-full rounded-full border border-border bg-background/60 pl-9 pr-4 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ember"
              />
            </div>
            <div className="relative">
              <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="h-10 appearance-none rounded-full border border-border bg-background/60 pl-9 pr-9 text-sm font-medium outline-none transition focus:border-ember"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Price slider */}
        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-border bg-card/40 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="h-4 w-4 text-ember" />
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Max price</span>
            <span className="font-display text-lg font-bold tabular-nums">{fmtPrice(maxPrice)}</span>
          </div>
          <input
            type="range"
            min={5000}
            max={30000}
            step={500}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="h-1.5 w-full max-w-md cursor-pointer appearance-none rounded-full bg-border accent-ember sm:w-72"
            aria-label="Maximum price"
          />
        </div>

        {/* Results */}
        <div className="mt-6 flex items-center justify-between">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            <Filter className="mr-2 inline h-3 w-3" />
            {filtered.length} {filtered.length === 1 ? "result" : "results"}
          </p>
        </div>

        <motion.div layout className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((p, i) => (
              <ShopCard key={p.id} p={p} idx={i} />
            ))}
          </AnimatePresence>
          {filtered.length === 0 && (
            <div className="col-span-full py-24 text-center">
              <p className="font-display text-2xl font-bold">Nothing here.</p>
              <p className="mt-2 text-sm text-muted-foreground">Try resetting your filters or widening the price range.</p>
            </div>
          )}
        </motion.div>
      </section>
    </div>
  );
}
