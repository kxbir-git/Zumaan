// Supabase Storage responsive image helper.
// Rewrites public object URLs to the render/image transform endpoint so we can
// request properly sized JPEG/WebP variants instead of shipping 4K/8K originals.

const PUBLIC_OBJECT = "/storage/v1/object/public/";
const RENDER_PUBLIC = "/storage/v1/render/image/public/";

export type ImgFit = "cover" | "contain" | "fill";

export interface ImgOpts {
  width: number;
  quality?: number; // 20–100
  resize?: ImgFit;
}

/** Single optimized URL. Falls back to the original src if not a Supabase public object. */
export function imgUrl(src: string, { width, quality = 75, resize = "cover" }: ImgOpts): string {
  if (!src) return src;
  const transformed = src.includes(PUBLIC_OBJECT)
    ? src.replace(PUBLIC_OBJECT, RENDER_PUBLIC)
    : src;
  // Only append params for Supabase transforms; other CDNs get the raw URL.
  if (transformed === src && !src.includes(RENDER_PUBLIC)) return src;
  const u = new URL(transformed);
  u.searchParams.set("width", String(Math.round(width)));
  u.searchParams.set("quality", String(quality));
  u.searchParams.set("resize", resize);
  return u.toString();
}

/** srcset string for an array of pixel widths. */
export function imgSrcSet(src: string, widths: number[], opts: Omit<ImgOpts, "width"> = {}): string {
  return widths
    .map((w) => `${imgUrl(src, { width: w, ...opts })} ${w}w`)
    .join(", ");
}

/** Sensible default ladders. */
export const CARD_WIDTHS = [320, 480, 640, 960, 1280];
export const HERO_WIDTHS = [640, 960, 1280, 1600, 1920];
