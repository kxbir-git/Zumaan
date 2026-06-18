import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  DollarSign,
  Loader2,
  Package,
  ShoppingBag,
  Users,
  XCircle,
} from "lucide-react";
import { adminStats } from "@/lib/orders.functions";

export const Route = createFileRoute("/_authenticated/admin/dashboard")({
  component: DashboardPage,
  head: () => ({ meta: [{ title: "Admin · Dashboard — Zuman" }] }),
});

const fmt = (c: number) => `₹${(c / 100).toFixed(2)}`;
const fmtCompact = (c: number) =>
  c >= 100000 ? `₹${(c / 100000).toFixed(1)}k` : `₹${(c / 100).toFixed(0)}`;

function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => adminStats(),
    refetchInterval: 60_000,
  });

  if (isLoading || !data) {
    return (
      <div className="grid min-h-[60dvh] place-items-center text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading metrics…</span>
      </div>
    );
  }

  const t = data.totals;
  const maxDaily = Math.max(1, ...data.daily.map((d) => d.cents));

  return (
    <div className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ember">Overview</p>
          <h1 className="mt-1 font-display text-3xl font-black tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Last 30 days · live data</p>
        </div>
        <Link
          to="/_authenticated/admin/orders"
          className="hidden items-center gap-1 rounded-full border border-border px-4 py-2 text-xs uppercase tracking-widest transition hover:border-ember hover:text-ember sm:inline-flex"
        >
          Review orders <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* KPIs */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Kpi
          label="Revenue · 30d"
          value={fmt(t.revenue30Cents)}
          sub={`${fmt(t.revenueCents)} all-time`}
          icon={DollarSign}
          tone="ember"
        />
        <Kpi
          label="Orders · 30d"
          value={t.orders30.toString()}
          sub={`${t.orders} total`}
          icon={ShoppingBag}
        />
        <Kpi
          label="Pending review"
          value={t.pending.toString()}
          sub="Awaiting approval"
          icon={Clock}
          tone="amber"
          href="/_authenticated/admin/orders"
        />
        <Kpi
          label="Approved"
          value={t.approved.toString()}
          sub={`${t.rejected} rejected`}
          icon={CheckCircle2}
          tone="emerald"
        />
        <Kpi label="Products" value={t.products.toString()} icon={Package} />
        <Kpi label="Customers" value={t.customers.toString()} icon={Users} />
        <Kpi
          label="AOV"
          value={t.approved ? fmt(Math.round(t.revenueCents / t.approved)) : "—"}
          sub="Average order value"
          icon={DollarSign}
        />
        <Kpi
          label="Conversion"
          value={t.orders ? `${Math.round((t.approved / t.orders) * 100)}%` : "—"}
          sub="Approved / total"
          icon={CheckCircle2}
        />
      </div>

      {/* Chart + recent */}
      <div className="mt-8 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-border bg-card/40 p-5">
          <div className="flex items-end justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Revenue trend</p>
              <p className="mt-1 font-display text-xl font-black">{fmt(t.revenue30Cents)}</p>
            </div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </div>
          <div className="mt-6 flex h-40 items-end gap-1">
            {data.daily.map((d) => {
              const h = (d.cents / maxDaily) * 100;
              return (
                <div key={d.date} className="group relative flex-1">
                  <div
                    className="w-full rounded-t bg-gradient-to-t from-ember/40 to-ember transition group-hover:from-ember/60"
                    style={{ height: `${Math.max(2, h)}%` }}
                    title={`${d.date}: ${fmt(d.cents)}`}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex justify-between font-mono text-[10px] text-muted-foreground">
            <span>{data.daily[0]?.date}</span>
            <span>{data.daily[data.daily.length - 1]?.date}</span>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card/40 p-5">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Recent orders</p>
            <Link to="/_authenticated/admin/orders" className="text-xs text-ember hover:underline">View all</Link>
          </div>
          <ul className="mt-3 divide-y divide-border">
            {data.recent.length === 0 && (
              <li className="py-8 text-center text-sm text-muted-foreground">No orders yet.</li>
            )}
            {data.recent.map((o: any) => (
              <li key={o.id}>
                <Link
                  to="/_authenticated/admin/orders/$orderId"
                  params={{ orderId: o.id }}
                  className="flex items-center justify-between gap-3 py-3 text-sm transition hover:text-ember"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{o.customer_name ?? "Guest"}</p>
                    <p className="truncate text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()} · #{o.id.slice(0, 6)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusPill status={o.payment_status} />
                    <span className="font-display tabular-nums">{fmtCompact(o.total_cents)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Kpi({
  label, value, sub, icon: Icon, tone, href,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: typeof DollarSign;
  tone?: "ember" | "amber" | "emerald";
  href?: string;
}) {
  const toneClass =
    tone === "ember" ? "text-ember bg-ember/10" :
    tone === "amber" ? "text-amber-400 bg-amber-500/10" :
    tone === "emerald" ? "text-emerald-400 bg-emerald-500/10" :
    "text-muted-foreground bg-muted/30";

  const inner = (
    <div className="rounded-2xl border border-border bg-card/40 p-4 transition hover:border-ember/40">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
        <span className={`grid h-7 w-7 place-items-center rounded-lg ${toneClass}`}>
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <p className="mt-3 font-display text-2xl font-black tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
  return href ? <Link to={href}>{inner}</Link> : inner;
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { c: string; Icon: typeof CheckCircle2 }> = {
    pending: { c: "bg-amber-500/15 text-amber-300", Icon: Clock },
    approved: { c: "bg-emerald-500/15 text-emerald-300", Icon: CheckCircle2 },
    rejected: { c: "bg-red-500/15 text-red-300", Icon: XCircle },
  };
  const { c, Icon } = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${c}`}>
      <Icon className="h-3 w-3" /> {status}
    </span>
  );
}
