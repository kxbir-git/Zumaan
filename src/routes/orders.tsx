import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Loader2, Package } from "lucide-react";
import { useAuth } from "@/lib/auth-store";
import { listMyOrders } from "@/lib/orders.functions";

export const Route = createFileRoute("/orders")({
  component: OrdersPage,
  head: () => ({ meta: [{ title: "My orders — NEONFIT" }] }),
});

const fmt = (c: number) => `₹${(c / 100).toFixed(2)}`;

function statusBadge(s: string, payment: string) {
  if (payment === "pending") return { label: "Awaiting review", cls: "bg-amber-500/15 text-amber-400" };
  if (payment === "rejected") return { label: "Payment rejected", cls: "bg-red-500/15 text-red-400" };
  return { label: s, cls: "bg-emerald-500/15 text-emerald-400" };
}

function OrdersPage() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const loadingAuth = useAuth((s) => s.loading);

  useEffect(() => {
    if (!loadingAuth && !user) navigate({ to: "/login" });
  }, [loadingAuth, user, navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ["my-orders", user?.id],
    queryFn: () => listMyOrders(),
    enabled: Boolean(user),
  });

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-ember">Account</p>
      <h1 className="mt-2 font-display text-3xl font-black tracking-tight">My orders</h1>

      {isLoading ? (
        <div className="mt-10 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : data && data.length > 0 ? (
        <ul className="mt-8 space-y-3">
          {data.map((o) => {
            const b = statusBadge(o.status, o.payment_status);
            return (
              <li key={o.id}>
                <Link
                  to="/orders/$orderId"
                  params={{ orderId: o.id }}
                  className="flex items-center justify-between rounded-2xl border border-border bg-card/40 p-4 transition hover:border-ember/60"
                >
                  <div className="space-y-1">
                    <p className="font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8)}</p>
                    <p className="text-sm">{new Date(o.created_at).toLocaleString()}</p>
                    {o.tracking_number && (
                      <p className="text-xs text-muted-foreground">{o.tracking_carrier} · {o.tracking_number}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${b.cls}`}>{b.label}</span>
                    <span className="font-display tabular-nums">{fmt(o.total_cents)}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-10 grid place-items-center gap-3 rounded-2xl border border-dashed border-border p-12 text-center">
          <Package className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No orders yet.</p>
        </div>
      )}
    </div>
  );
}
