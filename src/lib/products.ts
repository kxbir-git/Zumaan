import tee from "@/assets/product-tee.jpg";
import pants from "@/assets/product-pants.jpg";
import hoodie from "@/assets/product-hoodie.jpg";
import sneakers from "@/assets/product-sneakers.jpg";

export type Category = "Tops" | "Bottoms" | "Footwear" | "Accessories";

export interface Product {
  id: string;
  name: string;
  price: number; // cents
  tag: "NEW" | "DROP" | "LTD";
  image: string;
  category: Category;
  description: string;
  sizes: string[];
  colors: string[];
  material: string;
}

export const PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "TACTICAL CROP HOODIE",
    price: 14800,
    tag: "NEW",
    image: hoodie,
    category: "Tops",
    description:
      "Cropped tactical silhouette in heavyweight 480gsm loopback. Strap detail across chest, oversized hood, reinforced cuffs.",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Black", "Charcoal", "Ember"],
    material: "100% Organic Cotton / 480gsm",
  },
  {
    id: "p2",
    name: "STRAP CARGO 02",
    price: 18900,
    tag: "DROP",
    image: pants,
    category: "Bottoms",
    description:
      "Wide-leg cargo with utility straps, ripstop reinforcement, and seven pocket configuration. Built for movement.",
    sizes: ["28", "30", "32", "34", "36"],
    colors: ["Black", "Storm"],
    material: "Japanese Ripstop Nylon",
  },
  {
    id: "p3",
    name: "EMBER TEE / OVERSIZED",
    price: 6900,
    tag: "NEW",
    image: tee,
    category: "Tops",
    description:
      "Oversized boxy fit with dropped shoulders. Garment-dyed for a worn-in finish. Limited to 500 units worldwide.",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Bone", "Black", "Ember"],
    material: "230gsm Heavyweight Cotton",
  },
  {
    id: "p4",
    name: "ZERO-G RUNNER",
    price: 24500,
    tag: "LTD",
    image: sneakers,
    category: "Footwear",
    description:
      "Future-arch silhouette with translucent TPU midsole and reflective heel detail. Engineered upper, vegan construction.",
    sizes: ["7", "8", "9", "10", "11", "12"],
    colors: ["Onyx", "Bone"],
    material: "Recycled Knit + TPU",
  },
  {
    id: "p5",
    name: "PHANTOM TECH PANT",
    price: 17200,
    tag: "NEW",
    image: pants,
    category: "Bottoms",
    description:
      "Tapered tech pant with sealed seams, articulated knees, and hidden zip pockets. Water-resistant finish.",
    sizes: ["28", "30", "32", "34", "36"],
    colors: ["Black", "Graphite"],
    material: "4-Way Stretch Tech Twill",
  },
  {
    id: "p6",
    name: "ARCHIVE GRAPHIC TEE",
    price: 7400,
    tag: "DROP",
    image: tee,
    category: "Tops",
    description:
      "Archival 2027 graphic on heavyweight oversized tee. Screen-printed in small batches.",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Black", "Bone"],
    material: "240gsm Cotton",
  },
];

export const CATEGORIES = ["All", "Tops", "Bottoms", "Footwear", "Accessories"] as const;

export const fmtPrice = (cents: number) => `$${(cents / 100).toFixed(0)}`;

export const getProduct = (id: string) => PRODUCTS.find((p) => p.id === id);
