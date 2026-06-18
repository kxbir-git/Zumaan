import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, Loader2, Truck, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  adminGetOrder,
  approveOrder,
  rejectOrder,
  addTracking,
} from "@/lib/orders.functions";
import { sendTransactionalEmail } from "@/lib/email-send";

export const Route = createFileRoute("/_authenticated/admin/orders/$orderId")({
  component: AdminOrderDetail,
  head: () => ({ meta: [{ title: "Admin · Order — Zuman" }] }),
});

const fmt = (c: number) => `₹${(c / 100).toFixed(2)}`;

function AdminOrderDetail() {
  const { orderId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-order", orderId],
    queryFn: () => adminGetOrder({ data: { orderId } }),
  });

  const [busy, setBusy] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  if (isLoading) return <div className="grid min-h-[40dvh] place-items-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…</div>;
  if (!data) return <div className="mx-auto max-w-2xl px-6 py-16 text-center text-muted-foreground">Order not found.</div>;

  const { order, items, screenshotUrl } = data as any;

  const onApprove = async () => {
    setBusy("approve");
    try {
      const updated = await approveOrder({ data: { orderId } });
      const email = await sendTransactionalEmail({
        templateName: "payment-confirmed",
        recipientEmail: updated.customer_email ?? order.customer_email,
        idempotencyKey: `payment-confirmed-${orderId}`,
        templateData: {
          name: updated.customer_name ?? order.customer_name,
          orderId,
          total: fmt(updated.total_cents ?? order.total_cents),
        },
      });
      toast.success("Order approved." + (email.ok ? " Confirmation email sent." : " Email skipped — finish email setup to enable."));
      await Promise.all([refetch(), qc.invalidateQueries({ queryKey: ["admin-orders"] })]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(null);
    }
  };

  const onReject = async () => {
    if (rejectReason.trim().length < 3) return toast.error("Add a reason for the customer.");
    setBusy("reject");
    try {
      const updated = await rejectOrder({ data: { orderId, reason: rejectReason.trim() } });
      const email = await sendTransactionalEmail({
        templateName: "payment-rejected",
        recipientEmail: updated.customer_email ?? order.customer_email,
        idempotencyKey: `payment-rejected-${orderId}`,
        templateData: {
          name: updated.customer_name ?? order.customer_name,
          orderId,
          reason: rejectReason.trim(),
        },
      });
      toast.success("Order rejected." + (email.ok ? " Email sent." : " Email skipped."));
      await Promise.all([refetch(), qc.invalidateQueries({ queryKey: ["admin-orders"] })]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(null);
    }
  };

  const onAddTracking = async () => {
    if (carrier.trim().length < 2 || trackingNumber.trim().length < 3) {
      return toast.error("Carrier and tracking number are required.");
    }
    setBusy("tracking");
    try {
      const updated = await addTracking({
        data: { orderId, carrier: carrier.trim(), trackingNumber: trackingNumber.trim() },
      });
      const email = await sendTransactionalEmail({
        templateName: "tracking-added",
        recipientEmail: updated.customer_email ?? order.customer_email,
        idempotencyKey: `tracking-${orderId}-${trackingNumber.trim()}`,
        templateData: {
          name: updated.customer_name ?? order.customer_name,
          orderId,
          carrier: carrier.trim(),
          trackingNumber: trackingNumber.trim(),
        },
      });
      toast.success("Tracking saved." + (email.ok ? " Email sent." : " Email skipped."));
      setCarrier("");
      setTrackingNumber("");
      await refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(null);
    }
  };

  const pay = order.payment_status as "pending" | "approved" | "rejected";

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Link to="/_authenticated/admin/orders" className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
        ← All orders
      </Link>
      <h1 className="mt-3 font-display text-3xl font-black tracking-tight">Order #{order.id.slice(0, 8)}</h1>
      <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* Customer + items */}
        <section className="space-y-4">
          <div className="rounded-2xl border border-border bg-card/40 p-4 text-sm">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Customer</p>
            <p className="mt-1 font-medium">{order.customer_name}</p>
            <p className="text-muted-foreground">{order.customer_email}</p>
            {order.shipping_address && (
              <div className="mt-3 whitespace-pre-line text-xs text-muted-foreground">
                {[
                  order.shipping_address.line1,
                  order.shipping_address.line2,
                  `${order.shipping_address.city}${order.shipping_address.state ? ", " + order.shipping_address.state : ""} ${order.shipping_address.postal_code}`,
                  order.shipping_address.country,
                ]
                  .filter(Boolean)
                  .join("\n")}
              </div>
            )}
          </div>

          <ul className="divide-y divide-border rounded-2xl border border-border bg-card/40 text-sm">
            {items.map((i: any) => (
              <li key={i.id} className="flex gap-3 p-3">
                <div className="h-14 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
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

          <div className="rounded-2xl border border-border bg-card/40 p-4 text-sm">
            <Row label="Subtotal" value={fmt(order.subtotal_cents)} />
            <Row label="Shipping" value={order.shipping_cents === 0 ? "Free" : fmt(order.shipping_cents)} />
            <Row label="Total" value={fmt(order.total_cents)} bold />
          </div>
        </section>

        {/* Screenshot + actions */}
        <section className="space-y-4">
          <div className="rounded-2xl border border-border bg-card/40 p-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Payment screenshot</p>
            {screenshotUrl ? (
              <a href={screenshotUrl} target="_blank" rel="noreferrer" className="mt-3 block overflow-hidden rounded-xl border border-border">
                <img src={screenshotUrl} alt="Payment proof" className="max-h-96 w-full object-contain bg-background" />
              </a>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No screenshot attached.</p>
            )}
          </div>

          {pay === "pending" && (
            <div className="space-y-3 rounded-2xl border border-border bg-card/60 p-4">
              <button
                onClick={onApprove}
                disabled={busy !== null}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-emerald-500 font-medium text-emerald-950 transition hover:bg-emerald-400 disabled:opacity-50"
              >
                {busy === "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Approve payment & email customer
              </button>
              <div className="space-y-2">
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  maxLength={500}
                  rows={2}
                  placeholder="Reason for rejection (shown to customer)"
                  className="w-full rounded-xl border border-border bg-background/60 px-3 py-2 text-sm outline-none transition focus:border-ember"
                />
                <button
                  onClick={onReject}
                  disabled={busy !== null}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-full border border-red-500/40 text-sm text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                >
                  {busy === "reject" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  Reject & notify
                </button>
              </div>
            </div>
          )}

          {pay === "approved" && (
            <div className="space-y-3 rounded-2xl border border-border bg-card/60 p-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Add tracking</p>
              {order.tracking_number ? (
                <p className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-300">
                  <Truck className="h-3.5 w-3.5" /> {order.tracking_carrier} · {order.tracking_number}
                </p>
              ) : null}
              <input
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                maxLength={80}
                placeholder="Carrier (DHL, FedEx, India Post…)"
                className="h-10 w-full rounded-xl border border-border bg-background/60 px-3 text-sm outline-none transition focus:border-ember"
              />
              <input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                maxLength={120}
                placeholder="Tracking number"
                className="h-10 w-full rounded-xl border border-border bg-background/60 px-3 text-sm outline-none transition focus:border-ember"
              />
              <button
                onClick={onAddTracking}
                disabled={busy !== null}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-gradient-ember font-medium text-ember-foreground transition hover:glow-ember disabled:opacity-50"
              >
                {busy === "tracking" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
                {order.tracking_number ? "Update tracking & re-notify" : "Save tracking & email customer"}
              </button>
            </div>
          )}

          {pay === "rejected" && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-300">
              Rejected — {order.reject_reason || "(no reason)"}
            </div>
          )}
        </section>
      </div>
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
