import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, Loader2, Truck, XCircle } from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-store";
import { getMyOrder } from "@/lib/orders.functions";

export const Route = createFileRoute("/orders/$orderId")({
  component: OrderDetailPage,
  head: () => ({ meta: [{ title: "Order — NEONFIT" }] }),
});

const fmt = (c: number) => `$${(c / 100).toFixed(2)}`;

function OrderDetailPage() {
  const { orderId } = Route.useParams();
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const loadingAuth = useAuth((s) => s.loading);

  useEffect(() => {
    if (!loadingAuth && !user) navigate({ to: "/login" });
  }, [loadingAuth, user, navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ["my-order", orderId],
    queryFn: () => getMyOrder({ data: { orderId } }),
    enabled: Boolean(user),
  });

  if (isLoading) return <div className="grid min-h-[50dvh] place-items-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading order…</div>;
  if (!data) return <div className="mx-auto max-w-2xl px-6 py-24 text-center text-muted-foreground">Order not found.</div>;

  const { order, items } = data as any;
  const pay = order.payment_status as "pending" | "approved" | "rejected";

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link to="/orders" className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">← All orders</Link>
      <h1 className="mt-3 font-display text-3xl font-black tracking-tight">Order #{order.id.slice(0, 8)}</h1>
      <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>

      {/* Status banner */}
      <div className="mt-6 rounded-2xl border border-border bg-card/60 p-5">
        {pay === "pending" && (
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 h-5 w-5 text-amber-400" />
            <div>
              <p className="font-display text-lg font-bold">Awaiting payment review</p>
              <p className="text-sm text-muted-foreground">We received your screenshot and will confirm by email within a few hours.</p>
            </div>
          </div>
        )}
        {pay === "approved" && (
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-400" />
            <div>
              <p className="font-display text-lg font-bold">Payment approved</p>
              <p className="text-sm text-muted-foreground">We're preparing your order. You'll get a tracking email when it ships.</p>
              {order.tracking_number && (
                <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-300">
                  <Truck className="h-3.5 w-3.5" /> {order.tracking_carrier} · {order.tracking_number}
                </p>
              )}
            </div>
          </div>
        )}
        {pay === "rejected" && (
          <div className="flex items-start gap-3">
            <XCircle className="mt-0.5 h-5 w-5 text-red-400" />
            <div>
              <p className="font-display text-lg font-bold">Payment rejected</p>
              <p className="text-sm text-muted-foreground">{order.reject_reason || "Please contact support."}</p>
            </div>
          </div>
        )}
      </div>

      {/* Items */}
      <ul className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card/40">
        {items.map((i: any) => (
          <li key={i.id} className="flex gap-3 p-4">
            <div className="h-16 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
              {i.product_image && <img src={i.product_image} alt={i.product_name} className="h-full w-full object-cover" />}
            </div>
            <div className="flex flex-1 flex-col text-sm">
              <p className="font-medium">{i.product_name}</p>
              <p className="text-xs text-muted-foreground">{i.size} · {i.color} · ×{i.quantity}</p>
            </div>
            <p className="font-display tabular-nums">{fmt(i.unit_price_cents * i.quantity)}</p>
          </li>
        ))}
      </ul>

      <dl className="mt-3 space-y-1 rounded-2xl border border-border bg-card/40 p-4 text-sm">
        <Row label="Subtotal" value={fmt(order.subtotal_cents)} />
        <Row label="Shipping" value={order.shipping_cents === 0 ? "Free" : fmt(order.shipping_cents)} />
        <Row label="Total" value={fmt(order.total_cents)} bold />
      </dl>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${bold ? "font-display text-base font-bold" : ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
