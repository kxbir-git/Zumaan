import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, ShoppingBag, Settings, Loader2, ShieldAlert, ExternalLink } from "lucide-react";
import { checkIsAdmin, claimFirstAdmin } from "@/lib/admin.functions";
import { adminListOrders } from "@/lib/orders.functions";
import { useAuth } from "@/lib/auth-store";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminShell,
  head: () => ({ meta: [{ title: "Admin — NEONFIT" }] }),
});

const nav = [
  { to: "/_authenticated/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/_authenticated/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/_authenticated/admin/settings", label: "Settings", icon: Settings },
] as const;

function AdminShell() {
  const user = useAuthStore((s) => s.user);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const { data: admin, isLoading: checking } = useQuery({
    queryKey: ["isAdmin"],
    queryFn: () => checkIsAdmin(),
    staleTime: 60_000,
  });

  const { data: pendingOrders } = useQuery({
    queryKey: ["admin-orders", "pending"],
    queryFn: () => adminListOrders({ data: { filter: "pending" } }),
    enabled: Boolean(admin?.isAdmin),
    refetchInterval: 30_000,
  });
  const pendingCount = pendingOrders?.length ?? 0;

  if (checking) {
    return (
      <div className="grid min-h-[60dvh] place-items-center text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Checking access…</span>
      </div>
    );
  }

  if (!admin?.isAdmin) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-amber-400" />
        <h1 className="mt-4 font-display text-2xl font-black">Admin access required</h1>
        <p className="mt-2 text-sm text-muted-foreground">You're signed in but not an admin yet.</p>
        <button
          onClick={async () => {
            try {
              const res = await claimFirstAdmin();
              if (res.granted) {
                toast.success("You are now the admin.");
                location.reload();
              } else toast.error(res.reason ?? "Unable to grant admin");
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Failed");
            }
          }}
          className="mt-6 rounded-full bg-gradient-ember px-5 py-2.5 text-sm font-medium text-ember-foreground transition hover:glow-ember"
        >
          Claim admin (only if none exists yet)
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-background">
      <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-0 lg:grid-cols-[240px_1fr]">
        {/* Sidebar */}
        <aside className="sticky top-16 hidden h-[calc(100dvh-64px)] flex-col border-r border-border bg-card/30 px-3 py-6 lg:flex">
          <div className="px-3 pb-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ember">Admin</p>
            <p className="mt-1 font-display text-lg font-black">Control Center</p>
          </div>
          <nav className="flex flex-col gap-1">
            {nav.map((item) => {
              const active = item.exact ? pathname === "/_authenticated/admin/dashboard" || pathname === "/admin/dashboard" : pathname.includes(item.to.replace("/_authenticated", ""));
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`group flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                    active
                      ? "bg-ember/15 text-ember"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <span className="inline-flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </span>
                  {item.label === "Orders" && pendingCount > 0 && (
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 font-mono text-[10px] text-amber-300">
                      {pendingCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-border pt-4">
            <Link
              to="/"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-muted-foreground transition hover:text-foreground"
            >
              <ExternalLink className="h-3.5 w-3.5" /> View storefront
            </Link>
            <div className="px-3 pt-3">
              <p className="truncate font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Signed in</p>
              <p className="truncate text-xs text-foreground">{user?.email}</p>
            </div>
          </div>
        </aside>

        {/* Mobile nav */}
        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-card/30 px-3 py-2 lg:hidden">
          {nav.map((item) => {
            const active = pathname.includes(item.to.replace("/_authenticated", ""));
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs ${
                  active ? "bg-ember text-ember-foreground" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {item.label}
                {item.label === "Orders" && pendingCount > 0 && (
                  <span className="rounded-full bg-amber-500/20 px-1.5 text-[10px] text-amber-300">{pendingCount}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
