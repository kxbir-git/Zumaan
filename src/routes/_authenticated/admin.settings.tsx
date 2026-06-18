import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, ShieldAlert, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getSiteSettings, updateSiteSettings } from "@/lib/site-settings.functions";
import { checkIsAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettingsPage,
  head: () => ({ meta: [{ title: "Admin · Settings — Zuman" }] }),
});

function AdminSettingsPage() {
  const qc = useQueryClient();
  const { data: admin, isLoading: checking } = useQuery({
    queryKey: ["isAdmin"],
    queryFn: () => checkIsAdmin(),
    staleTime: 60_000,
  });
  const { data: settings, refetch } = useQuery({
    queryKey: ["site-settings"],
    queryFn: () => getSiteSettings(),
  });

  const [upi, setUpi] = useState("");
  const [instructions, setInstructions] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (settings) {
      setUpi(settings.payment_upi_id ?? "");
      setInstructions(settings.payment_instructions ?? "");
    }
  }, [settings]);

  useEffect(() => {
    if (!file) return setPreview(null);
    const u = URL.createObjectURL(file);
    setPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  if (checking) return <div className="grid min-h-[40dvh] place-items-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking…</div>;
  if (!admin?.isAdmin) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-amber-400" />
        <p className="mt-3">Admin only.</p>
      </div>
    );
  }

  const handleSave = async () => {
    setBusy(true);
    try {
      let payment_qr_path: string | undefined;
      if (file) {
        const ext = file.name.split(".").pop()?.toLowerCase() || "png";
        const path = `payment-qr/qr-${Date.now()}.${ext}`;
        const { error } = await supabase.storage
          .from("site-assets")
          .upload(path, file, { contentType: file.type, upsert: true });
        if (error) throw error;
        payment_qr_path = path;
      }
      await updateSiteSettings({
        data: {
          payment_upi_id: upi || null,
          payment_instructions: instructions || null,
          ...(payment_qr_path !== undefined ? { payment_qr_path } : {}),
        },
      });
      toast.success("Settings saved.");
      setFile(null);
      await refetch();
      qc.invalidateQueries({ queryKey: ["site-settings"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link to="/_authenticated/admin/orders" className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">← Orders</Link>
      <h1 className="mt-3 font-display text-3xl font-black tracking-tight">Payment settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">Configure the QR code, UPI ID, and instructions shown at checkout.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Current QR */}
        <div className="space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Current QR</p>
          <div className="aspect-square overflow-hidden rounded-xl border border-border bg-background">
            {(preview || settings?.payment_qr_url) ? (
              <img src={preview || settings!.payment_qr_url!} alt="QR" className="h-full w-full object-contain p-2" />
            ) : (
              <div className="grid h-full place-items-center px-4 text-center text-xs text-muted-foreground">No QR uploaded yet</div>
            )}
          </div>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-full border border-dashed border-border px-3 py-2 text-xs text-muted-foreground transition hover:border-ember hover:text-foreground">
            <Upload className="h-3.5 w-3.5" /> {file ? file.name : "Upload new QR (PNG/JPG)"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (f.size > 2 * 1024 * 1024) return toast.error("QR must be under 2 MB.");
                setFile(f);
              }}
            />
          </label>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">UPI ID / Pay handle</span>
            <input
              value={upi}
              onChange={(e) => setUpi(e.target.value)}
              maxLength={120}
              placeholder="merchant@upi"
              className="mt-1 h-11 w-full rounded-xl border border-border bg-background/60 px-3 text-sm outline-none transition focus:border-ember"
            />
          </label>
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Instructions</span>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              maxLength={2000}
              rows={5}
              placeholder="e.g. Scan the QR, pay the exact amount, then upload the screenshot. Orders confirmed within 4 hours."
              className="mt-1 w-full rounded-xl border border-border bg-background/60 px-3 py-2 text-sm outline-none transition focus:border-ember"
            />
          </label>
          <button
            onClick={handleSave}
            disabled={busy}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-gradient-ember font-medium text-ember-foreground transition hover:glow-ember disabled:opacity-50 sm:w-auto sm:px-8"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save settings
          </button>
        </div>
      </div>
    </div>
  );
}
