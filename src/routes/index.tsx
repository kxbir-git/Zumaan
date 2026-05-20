import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "NEONFIT — 2027 Streetwear" },
      { name: "description", content: "Phase 1 preview. Home page coming next." },
    ],
  }),
});

function Index() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-noir" />
      <div className="absolute -left-32 top-20 -z-10 h-96 w-96 rounded-full bg-ember/20 blur-3xl" />
      <div className="absolute -right-32 bottom-0 -z-10 h-96 w-96 rounded-full bg-ember/10 blur-3xl" />

      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-7xl flex-col items-center justify-center px-6 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-muted-foreground"
        >
          <Sparkles className="h-3 w-3 text-ember" /> Phase 1 · Foundation shipped
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
          className="mt-8 font-display text-6xl font-black leading-[0.9] tracking-tighter sm:text-8xl md:text-9xl"
        >
          NEON<span className="text-gradient-ember">FIT</span>
          <br />
          <span className="text-muted-foreground">/ 2027</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-8 max-w-xl text-balance text-base text-muted-foreground sm:text-lg"
        >
          Backend, database, auth schema, and the animated global shell are live.
          The cart drawer, theme toggle, and sticky glass header are wired and ready.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12 grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4"
        >
          {[
            { k: "DB", v: "5 tables" },
            { k: "Auth", v: "Roles + RLS" },
            { k: "Cart", v: "Zustand" },
            { k: "Motion", v: "Framer" },
          ].map((s) => (
            <div key={s.k} className="glass rounded-lg p-4 text-left">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{s.k}</p>
              <p className="mt-1 font-display text-lg font-bold">{s.v}</p>
            </div>
          ))}
        </motion.div>

        <p className="mt-14 font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Awaiting approval → Home page UI
        </p>
      </div>
    </section>
  );
}
