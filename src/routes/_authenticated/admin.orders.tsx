import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { adminListOrders } from "@/lib/orders.functions";
import { checkIsAdmin, claimFirstAdmin } from "@/lib/admin.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: AdminOrdersPage,
  head: () => ({ meta: [{ title: "Admin · Orders — Zuman" }] }),
});

const fmt = (c: number) => `₹${(c / 100).toFixed(2)}`;

function AdminOrdersPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");

  const { data: admin, isLoading: checking } = useQuery({
    queryKey: ["isAdmin"],
    queryFn: () => checkIsAdmin(),
    staleTime: 60_000,
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-orders", filter],
    queryFn: () => adminListOrders({ data: { filter } }),
    enabled: Boolean(admin?.isAdmin),
  });

  if (checking) return <div className="grid min-h-[40dvh] place-items-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking access…</div>;

  if (!admin?.isAdmin) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-amber-400" />
        <h1 className="mt-4 font-display text-2xl font-black">Admin access required</h1>
        <p className="mt-2 text-sm text-muted-foreground">You're signed in but not an admin yet.</p>
        <button
          onClick={async () => {
            try {
              const res = await claimFirstAdmin();
              if (res.granted) {
                toast.success("You are now the admin.");
                location.reload();
              } else {
                toast.error(res.reason ?? "Unable to grant admin");
              }
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Failed");
            }
          }}
          className="mt-6 rounded-full bg-gradient-ember px-5 py-2.5 text-sm font-medium text-ember-foreground transition hover:glow-ember"
        >
          Claim admin (only works if no admin exists yet)
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-ember">Admin</p>
      <div className="mt-2 flex items-end justify-between gap-4">
        <h1 className="font-display text-3xl font-black tracking-tight">Orders</h1>
        <Link
          to="/_authenticated/admin/settings"
          className="rounded-full border border-border px-4 py-2 text-sm transition hover:bg-accent"
        >
          Settings
        </Link>
      </div>

      <div className="mt-6 inline-flex rounded-full border border-border p-1">
        {(["pending", "approved", "rejected", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 font-mono text-[10px] uppercase tracking-widest transition ${
              filter === f ? "bg-ember text-ember-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : (
        <ul className="mt-6 space-y-2">
          {(data ?? []).map((o: any) => (
            <li key={o.id}>
              <Link
                to="/_authenticated/admin/orders/$orderId"
                params={{ orderId: o.id }}
                className="grid grid-cols-12 items-center gap-3 rounded-xl border border-border bg-card/40 p-4 text-sm transition hover:border-ember/60"
              >
                <span className="col-span-2 font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8)}</span>
                <span className="col-span-3 truncate">{o.customer_name ?? "—"}</span>
                <span className="col-span-3 truncate text-muted-foreground">{o.customer_email ?? "—"}</span>
                <span className="col-span-2 font-mono text-[10px] uppercase tracking-widest">{o.payment_status}</span>
                <span className="col-span-2 text-right font-display tabular-nums">{fmt(o.total_cents)}</span>
              </Link>
            </li>
          ))}
          {(data ?? []).length === 0 && (
            <li className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No orders in this filter.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
