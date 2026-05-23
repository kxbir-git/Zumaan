import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Heart, Loader2, Minus, Plus, Shield, ShoppingBag, Truck } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { fmtPrice, getProductById, type ProductDTO } from "@/lib/products.functions";
import { useCart } from "@/lib/cart-store";
import { HERO_WIDTHS, imgSrcSet, imgUrl } from "@/lib/image";

const productQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["products", "detail", id],
    queryFn: async () => {
      const p = await getProductById({ data: { id } });
      if (!p) throw notFound();
      return p;
    },
    staleTime: 60_000,
  });

export const Route = createFileRoute("/shop/$productId")({
  params: {
    parse: (raw) => ({ productId: z.string().uuid().parse(raw.productId) }),
    stringify: (params) => ({ productId: params.productId }),
  },
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(productQueryOptions(params.productId)),
  component: ProductPage,
  pendingComponent: () => (
    <div className="grid min-h-[60dvh] place-items-center">
      <Loader2 className="h-6 w-6 animate-spin text-ember" />
    </div>
  ),
  errorComponent: ({ error }) => {
    const router = useRouter();
    return (
      <div className="grid min-h-[60dvh] place-items-center px-6 text-center">
        <div>
          <h1 className="font-display text-3xl font-black">Couldn't load piece</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
          <button onClick={() => router.invalidate()} className="mt-6 rounded-full bg-gradient-ember px-6 py-3 text-sm font-medium text-ember-foreground transition hover:glow-ember">
            Retry
          </button>
        </div>
      </div>
    );
  },
  notFoundComponent: () => (
    <div className="grid min-h-[60dvh] place-items-center px-6 text-center">
      <div>
        <h1 className="font-display text-4xl font-black">Piece not found</h1>
        <p className="mt-2 text-muted-foreground">This drop doesn't exist or has been archived.</p>
        <Link to="/shop" className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-ember px-6 py-3 text-sm font-medium text-ember-foreground transition hover:glow-ember">
          <ArrowLeft className="h-4 w-4" /> Back to shop
        </Link>
      </div>
    </div>
  ),
});

function ProductPage() {
  const { productId } = Route.useParams();
  const { data: product } = useSuspenseQuery(productQueryOptions(productId)) as { data: ProductDTO };

  const add = useCart((s) => s.add);
  const [size, setSize] = useState(product.sizes[Math.floor(product.sizes.length / 2)] ?? "M");
  const [color, setColor] = useState(product.colors[0] ?? "Black");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const image = product.images[0] ?? "";

  const handleAdd = () => {
    add({
      productId: product.id,
      name: product.name,
      image,
      priceCents: product.price_cents,
      size,
      color,
      quantity: qty,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-16">
      <nav className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-foreground">Shop</Link>
        <span>/</span>
        <span className="text-ember">{product.category}</span>
      </nav>

      <div className="mt-8 grid gap-12 lg:grid-cols-2 lg:gap-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}
          className="relative"
        >
          <div className="sticky top-24 overflow-hidden rounded-2xl bg-muted">
            <div className="relative aspect-[4/5]">
              <img src={image} alt={product.name} className="h-full w-full object-cover" width={1080} height={1350} />
              {product.is_new && (
                <span className="absolute left-4 top-4 rounded-full bg-background/80 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ember backdrop-blur">
                  NEW
                </span>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-col"
        >
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">{product.category}</p>
          <h1 className="mt-3 font-display text-4xl font-black leading-none tracking-tighter sm:text-5xl">
            {product.name}
          </h1>
          <div className="mt-4 flex items-baseline gap-3">
            <p className="font-display text-3xl font-bold tabular-nums">{fmtPrice(product.price_cents)}</p>
            {product.compare_at_cents && product.compare_at_cents > product.price_cents && (
              <p className="font-mono text-sm text-muted-foreground line-through">{fmtPrice(product.compare_at_cents)}</p>
            )}
          </div>

          {product.description && (
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">{product.description}</p>
          )}

          {product.colors.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Color</span>
                <span className="text-sm font-medium">{color}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.colors.map((c: string) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      c === color
                        ? "border-ember bg-ember/10 text-foreground"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.sizes.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Size</span>
                <button className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                  Size guide
                </button>
              </div>
              <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6">
                {product.sizes.map((s: string) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`rounded-md border py-3 text-sm font-medium tabular-nums transition ${
                      s === size
                        ? "border-ember bg-ember text-ember-foreground glow-ember"
                        : "border-border hover:border-foreground"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex items-stretch gap-3">
            <div className="flex items-center rounded-full border border-border">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="grid h-12 w-12 place-items-center text-muted-foreground transition hover:text-foreground"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center font-mono text-sm tabular-nums">{qty}</span>
              <button
                onClick={() => setQty(qty + 1)}
                className="grid h-12 w-12 place-items-center text-muted-foreground transition hover:text-foreground"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={handleAdd}
              disabled={product.stock <= 0}
              className="group relative flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-ember font-medium text-ember-foreground transition hover:glow-ember disabled:cursor-not-allowed disabled:opacity-50"
            >
              <motion.span
                key={added ? "added" : "add"}
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                className="flex items-center gap-2"
              >
                {product.stock <= 0
                  ? "Sold out"
                  : added
                  ? <><Check className="h-4 w-4" /> Added</>
                  : <><ShoppingBag className="h-4 w-4" /> Add to bag · {fmtPrice(product.price_cents * qty)}</>}
              </motion.span>
            </button>

            <button
              className="grid h-12 w-12 place-items-center rounded-full border border-border text-muted-foreground transition hover:border-ember hover:text-ember"
              aria-label="Save to wishlist"
            >
              <Heart className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-10 grid gap-4 border-t border-border pt-8 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <Truck className="mt-0.5 h-4 w-4 text-ember" />
              <div>
                <p className="text-sm font-medium">Free shipping over $200</p>
                <p className="text-xs text-muted-foreground">Worldwide express. 3–5 days.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="mt-0.5 h-4 w-4 text-ember" />
              <div>
                <p className="text-sm font-medium">30-day returns</p>
                <p className="text-xs text-muted-foreground">Unworn, with tags. Easy process.</p>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-border bg-card/40 p-5">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Stock</p>
            <p className="mt-2 text-sm">
              {product.stock > 50
                ? "In stock — ships within 24h."
                : product.stock > 0
                ? `Only ${product.stock} left in this drop.`
                : "Sold out — restocks are rare."}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
