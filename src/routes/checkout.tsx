import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, ShieldCheck, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";
import { useCart, cartTotalCents } from "@/lib/cart-store";
import { getSiteSettings } from "@/lib/site-settings.functions";
import { createOrder } from "@/lib/orders.functions";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
  head: () => ({
    meta: [
      { title: "Checkout — NEONFIT" },
      { name: "description", content: "Pay by scanning the QR code, upload your screenshot, and we'll confirm your order." },
    ],
  }),
});

const fmt = (c: number) => `$${(c / 100).toFixed(2)}`;

function CheckoutPage() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const authLoading = useAuth((s) => s.loading);
  const { items, clear } = useCart();
  const subtotal = cartTotalCents(items);
  const shipping = subtotal >= 15000 ? 0 : 900;
  const total = subtotal + shipping;

  const { data: settings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: () => getSiteSettings(),
    staleTime: 60_000,
  });

  const [form, setForm] = useState({
    name: "",
    email: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/login" });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (user) setForm((f) => ({ ...f, email: f.email || user.email || "" }));
  }, [user]);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-display text-3xl font-black tracking-tight">Your bag is empty</h1>
        <p className="mt-3 text-muted-foreground">Add a few pieces first, then come back to check out.</p>
        <Link
          to="/shop"
          search={{ category: "All", q: "", sort: "featured", maxPrice: 30000, page: 1 }}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-ember px-6 py-3 font-medium text-ember-foreground transition hover:glow-ember"
        >
          Browse the shop <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const handleFile = (f: File | undefined | null) => {
    if (!f) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
      toast.error("Use a JPG, PNG, or WebP image.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error("Screenshot must be under 5 MB.");
      return;
    }
    setFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!file) {
      toast.error("Please upload your payment screenshot.");
      return;
    }
    setBusy(true);
    try {
      // 1) Upload screenshot under {userId}/{uuid}.{ext}
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("payment-proofs")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      // 2) Create order
      const { orderId } = await createOrder({
        data: {
          items: items.map((i) => ({
            productId: i.productId,
            size: i.size,
            color: i.color,
            quantity: i.quantity,
          })),
          customerName: form.name,
          customerEmail: form.email,
          shippingAddress: {
            line1: form.line1,
            line2: form.line2 || undefined,
            city: form.city,
            state: form.state || undefined,
            postal_code: form.postal_code,
            country: form.country,
          },
          paymentScreenshotPath: path,
        },
      });

      clear();
      toast.success("Order placed — we're reviewing your payment.");
      navigate({ to: "/orders/$orderId", params: { orderId } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[1.2fr_1fr] lg:gap-14">
      {/* Left: payment + form */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-ember">Checkout</p>
        <h1 className="mt-2 font-display text-4xl font-black tracking-tight">Scan to pay</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pay via UPI / any scanner app, then upload the screenshot. We'll confirm by email within a few hours.
        </p>

        {/* QR */}
        <div className="mt-6 grid gap-4 rounded-3xl border border-border bg-card/60 p-6 sm:grid-cols-[200px_1fr]">
          <div className="grid aspect-square place-items-center overflow-hidden rounded-xl border border-border bg-background">
            {settings?.payment_qr_url ? (
              <img src={settings.payment_qr_url} alt="Payment QR code" className="h-full w-full object-contain p-2" />
            ) : (
              <div className="px-3 text-center text-xs text-muted-foreground">
                QR code not configured yet. Ask the store owner to set it up.
              </div>
            )}
          </div>
          <div className="space-y-3 text-sm">
            {settings?.payment_upi_id && (
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">UPI ID</p>
                <p className="select-all font-display text-lg font-bold tracking-tight">{settings.payment_upi_id}</p>
              </div>
            )}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Amount</p>
              <p className="font-display text-2xl font-black tabular-nums text-ember">{fmt(total)}</p>
            </div>
            {settings?.payment_instructions && (
              <p className="whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
                {settings.payment_instructions}
              </p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <h2 className="font-display text-xl font-bold tracking-tight">Delivery details</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Full name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required maxLength={120} />
            <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required maxLength={255} />
            <Field label="Address line 1" value={form.line1} onChange={(v) => setForm({ ...form, line1: v })} required className="sm:col-span-2" maxLength={200} />
            <Field label="Address line 2 (optional)" value={form.line2} onChange={(v) => setForm({ ...form, line2: v })} className="sm:col-span-2" maxLength={200} />
            <Field label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} required maxLength={100} />
            <Field label="State / region" value={form.state} onChange={(v) => setForm({ ...form, state: v })} maxLength={100} />
            <Field label="Postal code" value={form.postal_code} onChange={(v) => setForm({ ...form, postal_code: v })} required maxLength={30} />
            <Field label="Country" value={form.country} onChange={(v) => setForm({ ...form, country: v })} required maxLength={80} />
          </div>

          <div>
            <h2 className="font-display text-xl font-bold tracking-tight">Payment screenshot</h2>
            <p className="mt-1 text-xs text-muted-foreground">Upload a clear image showing the transaction reference and amount.</p>

            <label className="mt-3 flex cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-background/40 px-4 py-6 text-sm text-muted-foreground transition hover:border-ember hover:text-foreground">
              <Upload className="h-4 w-4" />
              {file ? `${file.name} (${(file.size / 1024).toFixed(0)} KB)` : "Click to upload (JPG / PNG / WebP, max 5 MB)"}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </label>

            {preview && (
              <div className="mt-3 overflow-hidden rounded-xl border border-border">
                <img src={preview} alt="Screenshot preview" className="max-h-64 w-full object-contain bg-background" />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={busy}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-ember font-medium text-ember-foreground transition hover:glow-ember disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Submit order for review
          </button>
        </form>
      </motion.div>

      {/* Right: order summary */}
      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <h2 className="font-display text-xl font-bold tracking-tight">Your bag</h2>
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card/40">
          {items.map((i) => (
            <li key={i.id} className="flex gap-3 p-4">
              <div className="h-16 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                {i.image && <img src={i.image} alt={i.name} className="h-full w-full object-cover" />}
              </div>
              <div className="flex flex-1 flex-col text-sm">
                <p className="font-medium">{i.name}</p>
                <p className="text-xs text-muted-foreground">
                  {i.size} · {i.color} · ×{i.quantity}
                </p>
              </div>
              <p className="font-display tabular-nums">{fmt(i.priceCents * i.quantity)}</p>
            </li>
          ))}
        </ul>
        <dl className="space-y-1.5 rounded-2xl border border-border bg-card/40 px-4 py-3 text-sm">
          <Row label="Subtotal" value={fmt(subtotal)} />
          <Row label="Shipping" value={shipping === 0 ? "Free" : fmt(shipping)} />
          <Row label="Total" value={fmt(total)} bold />
        </dl>
      </aside>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", required, className = "", maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  className?: string;
  maxLength?: number;
}) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}{required && " *"}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        className="h-11 rounded-xl border border-border bg-background/60 px-3 text-sm outline-none transition focus:border-ember"
      />
    </label>
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
