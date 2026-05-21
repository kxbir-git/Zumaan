import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Heart, Minus, Plus, Shield, ShoppingBag, Truck } from "lucide-react";
import { useState } from "react";
import { fmtPrice, getProduct, PRODUCTS } from "@/lib/products";
import { useCart } from "@/lib/cart-store";

export const Route = createFileRoute("/shop/$productId")({
  component: ProductPage,
  loader: ({ params }) => {
    const product = getProduct(params.productId);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.product.name} — NEONFIT` },
          { name: "description", content: loaderData.product.description },
          { property: "og:title", content: `${loaderData.product.name} — NEONFIT` },
          { property: "og:description", content: loaderData.product.description },
          { property: "og:image", content: loaderData.product.image },
          { name: "twitter:image", content: loaderData.product.image },
        ]
      : [],
  }),
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
  const { product } = Route.useLoaderData();
  const add = useCart((s) => s.add);
  const [size, setSize] = useState(product.sizes[Math.floor(product.sizes.length / 2)]);
  const [color, setColor] = useState(product.colors[0]);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const related = PRODUCTS.filter((p) => p.id !== product.id && p.category === product.category).slice(0, 3);

  const handleAdd = () => {
    add({
      productId: product.id,
      name: product.name,
      image: product.image,
      priceCents: product.price,
      size,
      color,
      quantity: qty,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-16">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-foreground">Shop</Link>
        <span>/</span>
        <span className="text-ember">{product.category}</span>
      </nav>

      <div className="mt-8 grid gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}
          className="relative"
        >
          <div className="sticky top-24 overflow-hidden rounded-2xl bg-muted">
            <div className="relative aspect-[4/5]">
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover"
                width={1080}
                height={1350}
              />
              <span className="absolute left-4 top-4 rounded-full bg-background/80 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ember backdrop-blur">
                {product.tag}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-col"
        >
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">{product.category}</p>
          <h1 className="mt-3 font-display text-4xl font-black leading-none tracking-tighter sm:text-5xl">
            {product.name}
          </h1>
          <p className="mt-4 font-display text-3xl font-bold tabular-nums">{fmtPrice(product.price)}</p>

          <p className="mt-6 text-base leading-relaxed text-muted-foreground">{product.description}</p>

          {/* Color */}
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Color</span>
              <span className="text-sm font-medium">{color}</span>
            </div>
            <div className="mt-3 flex gap-2">
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

          {/* Size */}
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

          {/* Qty + add */}
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
              className="group relative flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-ember font-medium text-ember-foreground transition hover:glow-ember"
            >
              <motion.span
                key={added ? "added" : "add"}
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                className="flex items-center gap-2"
              >
                {added ? <><Check className="h-4 w-4" /> Added</> : <><ShoppingBag className="h-4 w-4" /> Add to bag · {fmtPrice(product.price * qty)}</>}
              </motion.span>
            </button>

            <button
              className="grid h-12 w-12 place-items-center rounded-full border border-border text-muted-foreground transition hover:border-ember hover:text-ember"
              aria-label="Save to wishlist"
            >
              <Heart className="h-4 w-4" />
            </button>
          </div>

          {/* Perks */}
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

          {/* Material */}
          <div className="mt-8 rounded-2xl border border-border bg-card/40 p-5">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Material</p>
            <p className="mt-2 text-sm">{product.material}</p>
          </div>
        </motion.div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-24 border-t border-border pt-16">
          <h2 className="font-display text-3xl font-black tracking-tighter sm:text-4xl">
            You might also <span className="text-gradient-ember">like</span>.
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {related.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              >
                <Link to="/shop/$productId" params={{ productId: p.id }} className="group block">
                  <div className="aspect-[4/5] overflow-hidden rounded-xl bg-muted">
                    <img src={p.image} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  </div>
                  <div className="mt-3 flex items-start justify-between">
                    <h3 className="font-display text-sm font-bold tracking-tight">{p.name}</h3>
                    <p className="font-display text-sm font-bold tabular-nums">{fmtPrice(p.price)}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
