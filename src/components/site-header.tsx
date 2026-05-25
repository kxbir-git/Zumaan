import { Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import { LogOut, Moon, Search, ShoppingBag, Sun, User } from "lucide-react";
import { useTheme } from "./theme-provider";
import { useCart, cartCount } from "@/lib/cart-store";
import { useAuth, signOut } from "@/lib/auth-store";
import { toast } from "sonner";

const NAV = [
  { to: "/shop", label: "Shop" },
  { to: "/shop", label: "New" },
  { to: "/shop", label: "Drops" },
  { to: "/", label: "About" },
] as const;

export function SiteHeader() {
  const { theme, toggle } = useTheme();
  const { items, toggle: toggleCart } = useCart();
  const user = useAuth((s) => s.user);
  const count = cartCount(items);
  const { scrollY } = useScroll();
  const backdropFilter = useTransform(scrollY, [0, 80], ["blur(0px) saturate(160%)", "blur(18px) saturate(160%)"]);
  const bg = useTransform(scrollY, [0, 80], ["rgba(0,0,0,0)", "color-mix(in oklab, var(--card) 70%, transparent)"]);

  const handleAuthClick = async () => {
    if (user) {
      await signOut();
      toast.success("Signed out");
    }
  };

  return (
    <motion.header
      style={{ backdropFilter, backgroundColor: bg }}
      className="sticky top-0 z-40 border-b border-transparent transition-colors data-[scrolled=true]:border-border"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="group flex items-center gap-2">
          <span className="relative grid h-8 w-8 place-items-center rounded-md bg-gradient-ember font-display text-sm font-black text-ember-foreground">
            N
            <span className="absolute inset-0 -z-10 rounded-md blur-md opacity-60 bg-gradient-ember" />
          </span>
          <span className="font-display text-lg font-black tracking-tight">NEONFIT</span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:inline">/27</span>
        </Link>

        {/* Nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((n, i) => (
            <Link
              key={i}
              to={n.to}
              className="group relative text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {n.label}
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-ember transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button className="rounded-md p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground">
            <Search className="h-[18px] w-[18px]" />
          </button>
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="rounded-md p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </button>
          {user ? (
            <button
              onClick={handleAuthClick}
              className="rounded-md p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground"
              aria-label="Sign out"
              title={user.email ?? "Sign out"}
            >
              <LogOut className="h-[18px] w-[18px]" />
            </button>
          ) : (
            <Link
              to="/login"
              className="rounded-md p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground"
              aria-label="Sign in"
            >
              <User className="h-[18px] w-[18px]" />
            </Link>
          )}
          <button
            onClick={toggleCart}
            className="relative ml-1 rounded-md p-2 text-foreground transition hover:bg-accent"
            aria-label="Open cart"
          >
            <ShoppingBag className="h-[18px] w-[18px]" />
            {count > 0 && (
              <motion.span
                key={count}
                initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-ember px-1 font-mono text-[10px] font-bold text-ember-foreground glow-ember"
              >
                {count}
              </motion.span>
            )}
          </button>
        </div>
      </div>
    </motion.header>
  );
}
