import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const addressSchema = z.object({
  line1: z.string().trim().min(2).max(200),
  line2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().max(100).optional().or(z.literal("")),
  postal_code: z.string().trim().min(2).max(30),
  country: z.string().trim().min(2).max(80),
});

const itemSchema = z.object({
  productId: z.string().uuid(),
  size: z.string().trim().max(20),
  color: z.string().trim().max(40),
  quantity: z.number().int().min(1).max(20),
});

const createOrderInput = z.object({
  items: z.array(itemSchema).min(1).max(50),
  customerName: z.string().trim().min(2).max(120),
  customerEmail: z.string().trim().email().max(255),
  shippingAddress: addressSchema,
  paymentScreenshotPath: z.string().trim().min(3).max(500),
});

export const createOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => createOrderInput.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Server-authoritative pricing: re-fetch from DB
    const productIds = Array.from(new Set(data.items.map((i) => i.productId)));
    const { data: products, error: prodErr } = await supabaseAdmin
      .from("products")
      .select("id,name,price_cents,images")
      .in("id", productIds);
    if (prodErr) throw new Error(prodErr.message);

    const byId = new Map(products?.map((p) => [p.id, p]) ?? []);
    const lineItems = data.items.map((i) => {
      const p = byId.get(i.productId);
      if (!p) throw new Error(`Unknown product ${i.productId}`);
      return {
        product_id: p.id,
        product_name: p.name,
        product_image: p.images?.[0] ?? null,
        size: i.size || null,
        color: i.color || null,
        quantity: i.quantity,
        unit_price_cents: p.price_cents,
      };
    });
    const subtotal = lineItems.reduce((s, l) => s + l.unit_price_cents * l.quantity, 0);
    const shipping = subtotal >= 15000 ? 0 : 900;
    const total = subtotal + shipping;

    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: userId,
        status: "pending",
        payment_status: "pending",
        subtotal_cents: subtotal,
        shipping_cents: shipping,
        total_cents: total,
        currency: "USD",
        shipping_address: data.shippingAddress,
        customer_name: data.customerName,
        customer_email: data.customerEmail,
        payment_screenshot_path: data.paymentScreenshotPath,
      })
      .select("id")
      .single();
    if (orderErr) throw new Error(orderErr.message);

    const { error: itemsErr } = await supabaseAdmin
      .from("order_items")
      .insert(lineItems.map((l) => ({ ...l, order_id: order.id })));
    if (itemsErr) throw new Error(itemsErr.message);

    return { orderId: order.id };
  });

export interface OrderListItem {
  id: string;
  created_at: string;
  status: string;
  payment_status: "pending" | "approved" | "rejected";
  total_cents: number;
  tracking_number: string | null;
  tracking_carrier: string | null;
}

export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<OrderListItem[]> => {
    const { data, error } = await context.supabase
      .from("orders")
      .select("id,created_at,status,payment_status,total_cents,tracking_number,tracking_carrier")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as OrderListItem[];
  });

export const getMyOrder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ orderId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: order, error } = await context.supabase
      .from("orders")
      .select("*")
      .eq("id", data.orderId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!order) return null;
    const { data: items } = await context.supabase
      .from("order_items")
      .select("*")
      .eq("order_id", data.orderId);
    return { order, items: items ?? [] };
  });

// ─── Admin endpoints ──────────────────────────────────────────────────────

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

export const adminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const since = new Date();
    since.setDate(since.getDate() - 30);
    const sinceIso = since.toISOString();

    const [allOrders, recent, productCount, customerCount] = await Promise.all([
      supabaseAdmin.from("orders").select("payment_status,total_cents,created_at"),
      supabaseAdmin
        .from("orders")
        .select("id,created_at,customer_name,customer_email,total_cents,payment_status")
        .order("created_at", { ascending: false })
        .limit(6),
      supabaseAdmin.from("products").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
    ]);

    const rows = allOrders.data ?? [];
    let pending = 0, approved = 0, rejected = 0, revenueCents = 0, revenue30Cents = 0, orders30 = 0;
    const dailyRevenue = new Map<string, number>();
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      dailyRevenue.set(d.toISOString().slice(0, 10), 0);
    }
    for (const r of rows) {
      if (r.payment_status === "pending") pending++;
      else if (r.payment_status === "approved") {
        approved++;
        revenueCents += r.total_cents ?? 0;
        if (r.created_at >= sinceIso) revenue30Cents += r.total_cents ?? 0;
      } else if (r.payment_status === "rejected") rejected++;
      if (r.created_at >= sinceIso) orders30++;
      const day = (r.created_at as string).slice(0, 10);
      if (r.payment_status === "approved" && dailyRevenue.has(day)) {
        dailyRevenue.set(day, (dailyRevenue.get(day) ?? 0) + (r.total_cents ?? 0));
      }
    }
    return {
      totals: {
        orders: rows.length,
        pending, approved, rejected,
        revenueCents, revenue30Cents, orders30,
        products: productCount.count ?? 0,
        customers: customerCount.count ?? 0,
      },
      recent: recent.data ?? [],
      daily: Array.from(dailyRevenue.entries()).map(([date, cents]) => ({ date, cents })),
    };
  });


export const adminListOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({ filter: z.enum(["pending", "approved", "rejected", "all"]).default("pending") })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("orders")
      .select(
        "id,created_at,customer_name,customer_email,total_cents,payment_status,status,tracking_number,tracking_carrier",
      )
      .order("created_at", { ascending: false });
    if (data.filter !== "all") q = q.eq("payment_status", data.filter);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const adminGetOrder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ orderId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", data.orderId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!order) return null;
    const { data: items } = await supabaseAdmin
      .from("order_items")
      .select("*")
      .eq("order_id", data.orderId);

    let screenshotUrl: string | null = null;
    if (order.payment_screenshot_path) {
      const { data: signed } = await supabaseAdmin.storage
        .from("payment-proofs")
        .createSignedUrl(order.payment_screenshot_path, 60 * 60);
      screenshotUrl = signed?.signedUrl ?? null;
    }
    return { order, items: items ?? [], screenshotUrl };
  });

export const approveOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ orderId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .update({
        payment_status: "approved",
        status: "processing",
        reviewed_at: new Date().toISOString(),
        reviewed_by: context.userId,
        reject_reason: null,
      })
      .eq("id", data.orderId)
      .select("id,customer_email,customer_name,total_cents")
      .single();
    if (error) throw new Error(error.message);
    return order;
  });

export const rejectOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        orderId: z.string().uuid(),
        reason: z.string().trim().min(3).max(500),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .update({
        payment_status: "rejected",
        status: "cancelled",
        reviewed_at: new Date().toISOString(),
        reviewed_by: context.userId,
        reject_reason: data.reason,
      })
      .eq("id", data.orderId)
      .select("id,customer_email,customer_name,reject_reason")
      .single();
    if (error) throw new Error(error.message);
    return order;
  });

export const addTracking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        orderId: z.string().uuid(),
        carrier: z.string().trim().min(2).max(80),
        trackingNumber: z.string().trim().min(3).max(120),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .update({
        tracking_carrier: data.carrier,
        tracking_number: data.trackingNumber,
        tracking_added_at: new Date().toISOString(),
        status: "shipped",
      })
      .eq("id", data.orderId)
      .select("id,customer_email,customer_name,tracking_carrier,tracking_number")
      .single();
    if (error) throw new Error(error.message);
    return order;
  });
