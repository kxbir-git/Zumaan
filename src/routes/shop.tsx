import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { z } from "zod";
import {
  CATEGORY_OPTIONS,
  SORT_OPTIONS,
  fmtPrice,
  listProducts,
  type Category,
  type ProductDTO,
  type Sort,
} from "@/lib/products.functions";
import { useCart } from "@/lib/cart-store";

const searchSchema = z.object({
  category: z.enum(CATEGORY_OPTIONS).catch("All"),
  q: z.string().trim().max(120).catch(""),
  sort: z.enum(SORT_OPTIONS).catch("featured"),
  maxPrice: z.coerce.number().int().min(0).max(100000).catch(30000),
  page: z.coerce.number().int().min(1).max(500).catch(1),
});

type ShopSearch = z.infer<typeof searchSchema>;

const PAGE_SIZE = 9;

const productsQueryOptions = (s: ShopSearch) =>
  queryOptions({
    queryKey: ["products", "list", s],
    queryFn: () =>
      listProducts({
        data: {
          category: s.category,
          search: s.q,
          sort: s.sort,
          maxPrice: s.maxPrice,
          page: s.page,
          pageSize: PAGE_SIZE,
        },
      }),
    staleTime: 30_000,
  });

export const Route = createFileRoute("/shop")({
  validateSearch: zodValidator(searchSchema),
  loaderDeps: ({ search }) => ({
    category: search.category,
    q: search.q,
    sort: search.sort,
    maxPrice: search.maxPrice,
    page: search.page,
  }),
  loader: ({ context, deps }) => {
    context.queryClient.ensureQueryData(productsQueryOptions(deps));
  },
  component: ShopPage,
  errorComponent: ShopError,
  pendingComponent: () => (
    <div className="grid min-h-[60dvh] place-items-center">
      <Loader2 className="h-6 w-6 animate-spin text-ember" />
    </div>
  ),
  head: () => ({
    meta: [
      { title: "Shop — NEONFIT 2027 Drop" },
      { name: "description", content: "Browse the full NEONFIT 2027 catalog. Techwear, oversized cuts, limited drops." },
      { property: "og:title", content: "Shop — NEONFIT 2027" },
      { property: "og:description", content: "Browse the full NEONFIT 2027 catalog." },
    ],
  }),
});

function ShopError({ error }: { error: Error }) {
  const router = useRouter();
  return (
    <div className="grid min-h-[60dvh] place-items-center px-6 text-center">
      <div>
        <h1 className="font-display text-3xl font-black">Catalog hiccup</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => router.invalidate()}
          className="mt-6 rounded-full bg-gradient-ember px-6 py-3 text-sm font-medium text-ember-foreground transition hover:glow-ember"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

function ShopCard({ p, idx }: { p: ProductDTO; idx: number }) {
  const add = useCart((s) => s.add);
  const image = p.images[0] ?? "";
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
            src={image}
            alt={p.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          {p.is_new && (
            <span className="absolute left-3 top-3 rounded-full bg-background/80 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-ember backdrop-blur">
              NEW
            </span>
          )}
          {p.compare_at_cents && p.compare_at_cents > p.price_cents && (
            <span className="absolute right-3 top-3 rounded-full bg-ember px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-ember-foreground glow-ember">
              SALE
            </span>
          )}
        </div>
      </Link>

      <button
        onClick={() =>
          add({
            productId: p.id,
            name: p.name,
            image,
            priceCents: p.price_cents,
            size: p.sizes[Math.floor(p.sizes.length / 2)] ?? "M",
            color: p.colors[0] ?? "Black",
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
        <div className="text-right">
          <p className="font-display text-sm font-bold tabular-nums">{fmtPrice(p.price_cents)}</p>
          {p.compare_at_cents && p.compare_at_cents > p.price_cents && (
            <p className="font-mono text-[10px] text-muted-foreground line-through">{fmtPrice(p.compare_at_cents)}</p>
          )}
        </div>
      </div>
    </motion.article>
  );
}

const SORT_LABELS: Record<Sort, string> = {
  featured: "Featured",
  newest: "Newest",
  "price-asc": "Price · Low → High",
  "price-desc": "Price · High → Low",
};

function ShopPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { data } = useSuspenseQuery(productsQueryOptions(search));

  const updateSearch = (patch: Partial<ShopSearch>) =>
    navigate({
      search: (prev: ShopSearch) => ({ ...prev, ...patch, page: "page" in patch ? patch.page! : 1 }),
      replace: true,
    });

  return (
    <div className="min-h-dvh">
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
            {data.total} item{data.total === 1 ? "" : "s"} in the archive · Filter by category, price, and search.
          </motion.p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="-mx-1 flex flex-1 gap-2 overflow-x-auto px-1 scrollbar-hide">
            {CATEGORY_OPTIONS.map((c: Category) => {
              const isActive = c === search.category;
              return (
                <button
                  key={c}
                  onClick={() => updateSearch({ category: c })}
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

          <div className="flex items-center gap-2">
            <div className="relative flex-1 lg:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search.q}
                onChange={(e) => updateSearch({ q: e.target.value })}
                placeholder="Search drops…"
                className="h-10 w-full rounded-full border border-border bg-background/60 pl-9 pr-4 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ember"
              />
            </div>
            <div className="relative">
              <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                value={search.sort}
                onChange={(e) => updateSearch({ sort: e.target.value as Sort })}
                className="h-10 appearance-none rounded-full border border-border bg-background/60 pl-9 pr-9 text-sm font-medium outline-none transition focus:border-ember"
              >
                {SORT_OPTIONS.map((s) => (
                  <option key={s} value={s}>{SORT_LABELS[s]}</option>
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
            <span className="font-display text-lg font-bold tabular-nums">{fmtPrice(search.maxPrice)}</span>
          </div>
          <input
            type="range"
            min={3000}
            max={30000}
            step={500}
            value={search.maxPrice}
            onChange={(e) => updateSearch({ maxPrice: Number(e.target.value) })}
            className="h-1.5 w-full max-w-md cursor-pointer appearance-none rounded-full bg-border accent-ember sm:w-72"
            aria-label="Maximum price"
          />
        </div>

        <div className="mt-6 flex items-center justify-between">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            <Filter className="mr-2 inline h-3 w-3" />
            {data.total} {data.total === 1 ? "result" : "results"} · Page {data.page}/{data.pageCount}
          </p>
        </div>

        <motion.div layout className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {data.items.map((p, i) => (
              <ShopCard key={p.id} p={p} idx={i} />
            ))}
          </AnimatePresence>
          {data.items.length === 0 && (
            <div className="col-span-full py-24 text-center">
              <p className="font-display text-2xl font-bold">Nothing here.</p>
              <p className="mt-2 text-sm text-muted-foreground">Try resetting your filters or widening the price range.</p>
              <button
                onClick={() => navigate({ search: () => ({ category: "All", q: "", sort: "featured", maxPrice: 30000, page: 1 }), replace: true })}
                className="mt-6 rounded-full border border-border px-5 py-2 text-sm font-medium transition hover:bg-accent"
              >
                Reset filters
              </button>
            </div>
          )}
        </motion.div>

        {/* Pagination */}
        {data.pageCount > 1 && (
          <nav className="mt-14 flex items-center justify-center gap-2" aria-label="Pagination">
            <button
              onClick={() => updateSearch({ page: Math.max(1, search.page - 1) })}
              disabled={search.page <= 1}
              className="grid h-10 w-10 place-items-center rounded-full border border-border transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: data.pageCount }).map((_, i) => {
              const n = i + 1;
              const isActive = n === data.page;
              return (
                <button
                  key={n}
                  onClick={() => updateSearch({ page: n })}
                  className={`grid h-10 min-w-10 place-items-center rounded-full border px-3 font-mono text-sm font-bold transition ${
                    isActive
                      ? "border-transparent bg-gradient-ember text-ember-foreground glow-ember"
                      : "border-border hover:bg-accent"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {n}
                </button>
              );
            })}
            <button
              onClick={() => updateSearch({ page: Math.min(data.pageCount, search.page + 1) })}
              disabled={search.page >= data.pageCount}
              className="grid h-10 w-10 place-items-center rounded-full border border-border transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </nav>
        )}
      </section>
    </div>
  );
}
