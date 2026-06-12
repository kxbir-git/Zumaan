import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect } from "react";

import appCss from "../styles.css?url";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteHeader } from "@/components/site-header";
import { CartDrawer } from "@/components/cart-drawer";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";
import { useWishlist } from "@/lib/wishlist-store";

function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-8xl font-black tracking-tight text-gradient-ember">404</h1>
        <h2 className="mt-4 font-display text-xl font-semibold">Off the grid</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This piece doesn't exist in our drop.
        </p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-full bg-gradient-ember px-5 py-2.5 text-sm font-medium text-ember-foreground transition hover:glow-ember">
            Back to shop
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-xl font-semibold">Something glitched</h1>
        <p className="mt-2 text-sm text-muted-foreground">Try again, or head home.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="rounded-full bg-gradient-ember px-5 py-2.5 text-sm font-medium text-ember-foreground transition hover:glow-ember">
            Retry
          </button>
          <a href="/" className="rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium transition hover:bg-accent">
            Home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "NEONFIT — 2027 Streetwear" },
      { name: "description", content: "Futuristic streetwear drops. Bold cuts, premium fabrics, limited runs." },
      { name: "theme-color", content: "#0d0d0d" },
      { property: "og:title", content: "NEONFIT — 2027 Streetwear" },
      { property: "og:description", content: "Futuristic streetwear drops." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("theme") ?? "dark";
    document.documentElement.classList.toggle("dark", stored !== "light");
  }, []);

  useEffect(() => {
    const { setUser, setIsAdmin } = useAuth.getState();
    const hydrateWishlist = useWishlist.getState().hydrate;
    const clearWishlist = useWishlist.getState().clear;

    const refreshAdmin = async (userId: string | undefined) => {
      if (!userId) return setIsAdmin(false);
      const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
      setIsAdmin(Boolean(data));
    };

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      if (data.session) {
        hydrateWishlist();
        refreshAdmin(data.session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      setUser(session?.user ?? null);
      if (session) {
        hydrateWishlist();
        refreshAdmin(session.user.id);
      } else {
        clearWishlist();
        setIsAdmin(false);
      }
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <div className="relative flex min-h-dvh flex-col bg-background text-foreground">
          <SiteHeader />
          <main className="flex-1">
            <Outlet />
          </main>
          <CartDrawer />
          <Toaster position="top-right" richColors />
        </div>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
