import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface SiteSettingsDTO {
  payment_qr_url: string | null; // signed URL good for ~1h
  payment_upi_id: string | null;
  payment_instructions: string | null;
}

// Public read — uses admin client to avoid leaking RLS specifics and to sign storage URL
export const getSiteSettings = createServerFn({ method: "GET" }).handler(
  async (): Promise<SiteSettingsDTO> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("site_settings")
      .select("payment_qr_path,payment_upi_id,payment_instructions")
      .eq("singleton", true)
      .maybeSingle();

    if (!row) return { payment_qr_url: null, payment_upi_id: null, payment_instructions: null };

    let qrUrl: string | null = null;
    if (row.payment_qr_path) {
      const { data: signed } = await supabaseAdmin.storage
        .from("site-assets")
        .createSignedUrl(row.payment_qr_path, 60 * 60);
      qrUrl = signed?.signedUrl ?? null;
    }

    return {
      payment_qr_url: qrUrl,
      payment_upi_id: row.payment_upi_id ?? null,
      payment_instructions: row.payment_instructions ?? null,
    };
  },
);

const updateInput = z.object({
  payment_upi_id: z.string().trim().max(120).nullable().optional(),
  payment_instructions: z.string().trim().max(2000).nullable().optional(),
  payment_qr_path: z.string().trim().max(500).nullable().optional(),
});

export const updateSiteSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => updateInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("site_settings")
      .update({
        payment_upi_id: data.payment_upi_id ?? null,
        payment_instructions: data.payment_instructions ?? null,
        ...(data.payment_qr_path !== undefined ? { payment_qr_path: data.payment_qr_path } : {}),
      })
      .eq("singleton", true);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
