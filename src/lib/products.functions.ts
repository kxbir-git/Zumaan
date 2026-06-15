import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const CATEGORY_OPTIONS = ["All", "Tops", "Bottoms", "Footwear", "Accessories"] as const;
export const SORT_OPTIONS = ["featured", "newest", "price-asc", "price-desc"] as const;

export type Category = (typeof CATEGORY_OPTIONS)[number];
export type Sort = (typeof SORT_OPTIONS)[number];

export interface ProductDTO {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price_cents: number;
  compare_at_cents: number | null;
  category: string;
  sizes: string[];
  colors: string[];
  images: string[];
  stock: number;
  featured: boolean;
  is_new: boolean;
}

export interface ListProductsResult {
  items: ProductDTO[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

const listInput = z.object({
  category: z.enum(CATEGORY_OPTIONS).optional().default("All"),
  search: z.string().trim().max(120).optional().default(""),
  sort: z.enum(SORT_OPTIONS).optional().default("featured"),
  maxPrice: z.number().int().min(0).max(1_000_000).optional().default(300_00),
  page: z.number().int().min(1).max(500).optional().default(1),
  pageSize: z.number().int().min(1).max(48).optional().default(9),
});

export const listProducts = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => listInput.parse(input))
  .handler(async ({ data }): Promise<ListProductsResult> => {
    const { category, search, sort, maxPrice, page, pageSize } = data;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("products")
      .select(
        "id,slug,name,description,price_cents,compare_at_cents,category,sizes,colors,images,stock,featured,is_new",
        { count: "exact" },
      )
      .lte("price_cents", maxPrice);

    if (category !== "All") query = query.eq("category", category);
    if (search) query = query.ilike("name", `%${search}%`);

    switch (sort) {
      case "price-asc":
        query = query.order("price_cents", { ascending: true });
        break;
      case "price-desc":
        query = query.order("price_cents", { ascending: false });
        break;
      case "newest":
        query = query.order("is_new", { ascending: false }).order("created_at", { ascending: false });
        break;
      default:
        query = query.order("featured", { ascending: false }).order("created_at", { ascending: false });
    }

    const { data: rows, count, error } = await query.range(from, to);
    if (error) throw new Error(error.message);

    const total = count ?? 0;
    return {
      items: (rows ?? []) as ProductDTO[],
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
    };
  });

export const getProductById = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }): Promise<ProductDTO | null> => {
    const { data: row, error } = await supabase
      .from("products")
      .select(
        "id,slug,name,description,price_cents,compare_at_cents,category,sizes,colors,images,stock,featured,is_new",
      )
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (row as ProductDTO | null) ?? null;
  });

export const fmtPrice = (cents: number) => `₹${(cents / 100).toFixed(0)}`;
