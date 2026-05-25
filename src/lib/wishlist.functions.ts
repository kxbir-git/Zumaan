import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listWishlist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("wishlist_items")
      .select("product_id")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => r.product_id as string);
  });

export const toggleWishlist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ productId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("wishlist_items")
      .select("id")
      .eq("user_id", userId)
      .eq("product_id", data.productId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("wishlist_items")
        .delete()
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { saved: false };
    }

    const { error } = await supabase
      .from("wishlist_items")
      .insert({ user_id: userId, product_id: data.productId });
    if (error) throw new Error(error.message);
    return { saved: true };
  });
