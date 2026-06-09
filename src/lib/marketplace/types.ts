export type ProductCategory =
  | "plants"
  | "soil"
  | "fertilizer"
  | "pots"
  | "irrigation"
  | "pruning_tools"
  | "pest_control"
  | "bonsai_supplies";

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  plants: "Plants",
  soil: "Soil",
  fertilizer: "Fertilizer",
  pots: "Pots",
  irrigation: "Irrigation",
  pruning_tools: "Pruning tools",
  pest_control: "Pest control",
  bonsai_supplies: "Bonsai supplies",
};

export interface ProductRecommendation {
  id: string;
  name: string;
  category: ProductCategory;
  description: string;
  bestFor: string;
  priceRange: string;
  whyItFits: string;
  whatToAvoid: string;
  imageUrl?: string;
  affiliateUrl?: string | null;
}

export interface BuyingGuide {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  zipAware?: boolean;
  intro: string;
  picks: string[];
  productIds: string[];
}

export interface GuidePlantPick {
  name: string;
  why: string;
  zone?: string;
}

export interface BuyingGuideDetail extends BuyingGuide {
  plantPicks?: GuidePlantPick[];
}
