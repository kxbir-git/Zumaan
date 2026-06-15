import { createFileRoute } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Plus, Sparkles, Star, Zap } from "lucide-react";
import { useRef, useState } from "react";
import heroImg from "@/assets/hero-model.jpg";
import tee from "@/assets/product-tee.jpg";
import pants from "@/assets/product-pants.jpg";
import hoodie from "@/assets/product-hoodie.jpg";
import sneakers from "@/assets/product-sneakers.jpg";
import { useCart } from "@/lib/cart-store";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "NEONFIT — Futuristic Streetwear / 2027 Drops" },
      { name: "description", content: "Bold streetwear cuts, premium techwear fabrics, limited runs. Shop the 2027 collection." },
      { property: "og:title", content: "NEONFIT — Futuristic Streetwear" },
      { property: "og:description", content: "Bold streetwear cuts, premium techwear fabrics, limited runs." },
      { property: "og:image", content: heroImg },
    ],
  }),
});

const PRODUCTS = [
  { id: "p1", name: "TACTICAL CROP HOODIE", price: 14800, tag: "NEW", image: hoodie, category: "Tops" },
  { id: "p2", name: "STRAP CARGO 02", price: 18900, tag: "DROP", image: pants, category: "Bottoms" },
  { id: "p3", name: "EMBER TEE / OVERSIZED", price: 6900, tag: "NEW", image: tee, category: "Tops" },
  { id: "p4", name: "ZERO-G RUNNER", price: 24500, tag: "LTD", image: sneakers, category: "Footwear" },
  { id: "p5", name: "PHANTOM TECH PANT", price: 17200, tag: "NEW", image: pants, category: "Bottoms" },
  { id: "p6", name: "ARCHIVE GRAPHIC TEE", price: 7400, tag: "DROP", image: tee, category: "Tops" },
];

const CATEGORIES = ["All", "Tops", "Bottoms", "Footwear", "Accessories"] as const;

const fmt = (c: number) => `₹${(c / 100).toFixed(0)}`;

function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} className="relative h-[100dvh] min-h-[700px] overflow-hidden bg-gradient-noir">
      <motion.div style={{ y, opacity }} className="absolute inset-0">
        <img
          src={heroImg}
          alt="NEONFIT 2027 collection model in techwear"
          className="h-full w-full object-cover object-[60%_center] opacity-80"
          width={1080}
          height={1920}
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
      </motion.div>

      {/* Ember spotlight */}
      <div className="pointer-events-none absolute left-1/4 top-1/3 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-ember/20 blur-[120px]" />

      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-6 pb-20 sm:pb-24 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="inline-flex w-fit items-center gap-2 rounded-full glass px-4 py-1.5 text-xs uppercase tracking-[0.25em] text-muted-foreground"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ember opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-ember" />
          </span>
          Drop 04 · Live now
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15 }}
          className="mt-6 max-w-4xl font-display text-[clamp(3.5rem,10vw,9rem)] font-black leading-[0.85] tracking-tighter"
        >
          WEAR THE
          <br />
          <span className="text-gradient-ember">FUTURE</span>
          <span className="text-muted-foreground">.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-6 max-w-md text-balance text-base text-muted-foreground sm:text-lg"
        >
          Techwear cuts, archival graphics, and limited drops. Built for the streets of 2027.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.55 }}
          className="mt-10 flex flex-wrap items-center gap-3"
        >
          <a href="#shop" className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-ember px-7 py-3.5 font-medium text-ember-foreground transition-all hover:scale-[1.02] hover:glow-ember">
            Shop the drop
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
          <a href="#shop" className="inline-flex items-center gap-2 rounded-full border border-border bg-background/40 px-7 py-3.5 font-medium backdrop-blur transition hover:bg-accent">
            <Zap className="h-4 w-4 text-ember" /> Lookbook 04
          </a>
        </motion.div>

        {/* Marquee strip */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          className="mt-14 flex items-center gap-8 border-t border-border/50 pt-6 font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground"
        >
          <span>04 · NEONFIT/27</span>
          <span className="hidden h-px flex-1 bg-border sm:block" />
          <span className="hidden sm:inline">Free worldwide shipping over $200</span>
          <span className="hidden md:inline">·</span>
          <span className="hidden md:inline">Limited to 500 units</span>
        </motion.div>
      </div>
    </section>
  );
}

function ProductCard({ p, idx }: { p: (typeof PRODUCTS)[number]; idx: number }) {
  const add = useCart((s) => s.add);
  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: idx * 0.05 }}
      className="group relative shrink-0 snap-start"
    >
      <div className="relative aspect-[4/5] w-[280px] overflow-hidden rounded-xl bg-muted sm:w-[320px] md:w-[360px]">
        <img
          src={p.image}
          alt={p.name}
          loading="lazy"
          width={1024}
          height={1280}
          className="h-full w-full object-cover transition-transform duration-700 will-change-transform group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        {/* Tag */}
        <span className="absolute left-3 top-3 rounded-full bg-background/80 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-ember backdrop-blur">
          {p.tag}
        </span>

        {/* Add button */}
        <button
          onClick={() =>
            add({
              productId: p.id,
              name: p.name,
              image: p.image,
              priceCents: p.price,
              size: "M",
              color: "Black",
            })
          }
          className="absolute bottom-4 right-4 grid h-11 w-11 translate-y-2 place-items-center rounded-full bg-gradient-ember text-ember-foreground opacity-0 shadow-lg transition-all duration-300 hover:scale-110 hover:glow-ember group-hover:translate-y-0 group-hover:opacity-100"
          aria-label={`Add ${p.name} to bag`}
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{p.category}</p>
          <h3 className="mt-0.5 font-display text-sm font-bold tracking-tight">{p.name}</h3>
        </div>
        <p className="font-display text-sm font-bold tabular-nums">{fmt(p.price)}</p>
      </div>
    </motion.article>
  );
}

function NewArrivals() {
  return (
    <section id="shop" className="relative border-t border-border py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="flex items-end justify-between gap-6"
        >
          <div>
            <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-ember">
              <Sparkles className="h-3 w-3" /> New arrivals
            </p>
            <h2 className="mt-3 font-display text-4xl font-black tracking-tighter sm:text-6xl">
              Fresh off the press<span className="text-ember">.</span>
            </h2>
          </div>
          <a href="#" className="group hidden items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground sm:inline-flex">
            View all
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </motion.div>

        <div className="mt-12 -mx-6 overflow-x-auto px-6 scrollbar-hide">
          <div className="flex snap-x snap-mandatory gap-6 pb-2">
            {PRODUCTS.map((p, i) => (
              <ProductCard key={p.id} p={p} idx={i} />
            ))}
            <div className="shrink-0 pr-6" aria-hidden />
          </div>
        </div>
      </div>
    </section>
  );
}

function CategoryTabs() {
  const [active, setActive] = useState<(typeof CATEGORIES)[number]>("All");
  const filtered = active === "All" ? PRODUCTS : PRODUCTS.filter((p) => p.category === active);

  return (
    <section className="relative border-t border-border bg-gradient-to-b from-background via-card/20 to-background py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }}
        >
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-ember">Shop by category</p>
          <h2 className="mt-3 font-display text-4xl font-black tracking-tighter sm:text-6xl">
            Pick your <span className="text-gradient-ember">poison</span>.
          </h2>
        </motion.div>

        {/* Tabs */}
        <div className="mt-10 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const isActive = c === active;
            return (
              <button
                key={c}
                onClick={() => setActive(c)}
                className="relative rounded-full border border-border px-5 py-2 text-sm font-medium transition"
              >
                {isActive && (
                  <motion.span
                    layoutId="cat-pill"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    className="absolute inset-0 -z-10 rounded-full bg-gradient-ember glow-ember"
                  />
                )}
                <span className={isActive ? "text-ember-foreground" : "text-foreground"}>{c}</span>
              </button>
            );
          })}
        </div>

        {/* Grid */}
        <motion.div
          layout
          className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filtered.map((p, i) => (
            <motion.div key={p.id} layout className="w-full">
              <ProductCard p={{ ...p }} idx={i} />
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full py-16 text-center text-muted-foreground">No drops in this category yet.</p>
          )}
        </motion.div>
      </div>
    </section>
  );
}

function ManifestoStrip() {
  return (
    <section className="relative overflow-hidden border-y border-border bg-card py-20">
      <div className="pointer-events-none absolute -left-20 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-ember/15 blur-3xl" />
      <div className="mx-auto grid max-w-7xl gap-12 px-6 md:grid-cols-3 lg:px-8">
        {[
          { icon: Zap, k: "Limited drops", v: "500 units. Once gone, archived forever." },
          { icon: Star, k: "Premium techwear", v: "Japanese ripstop, milled hardware, reinforced seams." },
          { icon: Sparkles, k: "Built for 2027", v: "Designed in collaboration with underground designers." },
        ].map((b, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
            className="group"
          >
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-ember text-ember-foreground transition group-hover:glow-ember">
              <b.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-5 font-display text-2xl font-bold tracking-tight">{b.k}</h3>
            <p className="mt-2 text-muted-foreground">{b.v}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-6 sm:flex-row sm:items-center lg:px-8">
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-gradient-ember font-display font-black text-ember-foreground">N</span>
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">© NEONFIT/27 · All rights reserved</span>
        </div>
        <nav className="flex flex-wrap gap-6 text-sm text-muted-foreground">
          <a href="#" className="transition hover:text-foreground">Returns</a>
          <a href="#" className="transition hover:text-foreground">Shipping</a>
          <a href="#" className="transition hover:text-foreground">Contact</a>
          <a href="#" className="transition hover:text-foreground">Instagram</a>
        </nav>
      </div>
    </footer>
  );
}

function Index() {
  return (
    <>
      <Hero />
      <NewArrivals />
      <CategoryTabs />
      <ManifestoStrip />
      <Footer />
    </>
  );
}
