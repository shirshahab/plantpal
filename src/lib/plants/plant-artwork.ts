/**
 * PlantPal artwork library.
 *
 * Image hierarchy (never show a blank image):
 *   1. User uploaded photo
 *   2. Plant species artwork (hand-made PlantPal illustrations)
 *   3. Remote species photo (Perenual / plant database)
 *   4. Plant category artwork
 *   5. Generic PlantPal artwork
 */
import type { PlaceholderImageType, PhotoStatus } from "./plant-size";

export const GENERIC_PLANT_ARTWORK = "/artwork/plantpal-generic.webp";

export type ArtworkCategory =
  | "fruit-tree"
  | "flower"
  | "houseplant"
  | "vegetable"
  | "herb"
  | "bonsai"
  | "shrub"
  | "palm"
  | "cactus"
  | "succulent"
  | "vine"
  | "tropical";

export const CATEGORY_ARTWORK: Record<ArtworkCategory, string> = {
  "fruit-tree": "/artwork/categories/fruit-tree.webp",
  flower: "/artwork/categories/flower.webp",
  houseplant: "/artwork/categories/houseplant.webp",
  vegetable: "/artwork/categories/vegetable.webp",
  herb: "/artwork/categories/herb.webp",
  bonsai: "/artwork/categories/bonsai.webp",
  shrub: "/artwork/categories/shrub.webp",
  palm: "/artwork/categories/palm.webp",
  cactus: "/artwork/categories/cactus.webp",
  succulent: "/artwork/categories/succulent.webp",
  vine: "/artwork/categories/vine.webp",
  tropical: "/artwork/categories/tropical.webp",
};

export const CATEGORY_LABELS: Record<ArtworkCategory, string> = {
  "fruit-tree": "Fruit Tree",
  flower: "Flower",
  houseplant: "Houseplant",
  vegetable: "Vegetable",
  herb: "Herb",
  bonsai: "Bonsai",
  shrub: "Shrub",
  palm: "Palm",
  cactus: "Cactus",
  succulent: "Succulent",
  vine: "Vine",
  tropical: "Tropical",
};

/** Species artwork — order matters (rosemary before rose, etc.). */
const SPECIES_ARTWORK: { match: RegExp; src: string }[] = [
  { match: /bougainvillea|bouganvil/i, src: "/artwork/species/bougainvillea.webp" },
  { match: /lemon|citrus\s+limon|citrus\s*×?\s*meyeri/i, src: "/artwork/species/lemon.webp" },
  { match: /avocado|persea\s+americana/i, src: "/artwork/species/avocado.webp" },
  { match: /olive|olea\s+europaea/i, src: "/artwork/species/olive-tree.webp" },
  { match: /japanese\s+maple|acer\s+palmatum|\bmaple\b/i, src: "/artwork/species/japanese-maple.webp" },
  { match: /lavender|lavandula/i, src: "/artwork/species/lavender.webp" },
  { match: /rosemary|rosmarinus|salvia\s+rosmarinus/i, src: "/artwork/species/rosemary.webp" },
  { match: /\broses?\b|\brosa\b/i, src: "/artwork/species/rose.webp" },
  { match: /monstera|swiss\s+cheese\s+plant/i, src: "/artwork/species/monstera.webp" },
  { match: /snake\s+plant|sansevieria|dracaena\s+trifasciata/i, src: "/artwork/species/snake-plant.webp" },
  { match: /pothos|epipremnum/i, src: "/artwork/species/pothos.webp" },
  { match: /fiddle[\s-]+leaf|ficus\s+lyrata/i, src: "/artwork/species/fiddle-leaf-fig.webp" },
  { match: /\bbasil\b|ocimum\s+basilicum/i, src: "/artwork/species/basil.webp" },
  { match: /tomato|solanum\s+lycopersicum/i, src: "/artwork/species/tomato.webp" },
];

/** PlantPal species artwork for a name/species blob, if we have one. */
export function getSpeciesArtwork(text: string): string | null {
  if (!text?.trim()) return null;
  for (const entry of SPECIES_ARTWORK) {
    if (entry.match.test(text)) return entry.src;
  }
  return null;
}

/** Map the legacy placeholder type to an artwork category. */
export function categoryFromPlaceholderType(
  type: PlaceholderImageType
): ArtworkCategory {
  switch (type) {
    case "tree":
      return "fruit-tree";
    case "flower":
      return "flower";
    case "succulent":
      return "succulent";
    case "vegetable":
      return "vegetable";
    case "bonsai":
      return "bonsai";
    case "shrub":
      return "shrub";
    case "houseplant":
    default:
      return "houseplant";
  }
}

/** Infer an artwork category from free text (species, name, plant type). */
export function inferArtworkCategory(text: string): ArtworkCategory {
  const t = (text ?? "").toLowerCase();
  if (/bonsai|juniper(\s+procumbens)?|ficus\s+retusa/.test(t)) return "bonsai";
  if (/cactus|saguaro|opuntia|prickly\s+pear|barrel/.test(t)) return "cactus";
  if (/succulent|aloe|echeveria|agave|sedum|jade|haworthia|crassula/.test(t)) return "succulent";
  if (/\bpalm\b|areca|kentia|sago/.test(t)) return "palm";
  if (/bird\s+of\s+paradise|banana|plumeria|hibiscus|tropical|alocasia|calathea|bromeliad/.test(t)) return "tropical";
  if (/\bvine\b|\bivy\b|grape|wisteria|jasmine|clematis|passion\s*(fruit|flower)|honeysuckle/.test(t)) return "vine";
  if (/\bherb\b|mint|thyme|oregano|\bsage\b|cilantro|parsley|chive|dill|rosemary|basil|lavender/.test(t)) return "herb";
  if (/tomato|pepper|cucumber|lettuce|squash|kale|zucchini|carrot|broccoli|spinach|eggplant|vegetable/.test(t)) return "vegetable";
  if (/lemon|lime|orange|apple|peach|avocado|\bfig\b|pomegranate|cherry|plum|pear|apricot|citrus|fruit|olive|mango|loquat|persimmon|kumquat/.test(t)) return "fruit-tree";
  if (/flower|rose|petunia|marigold|azalea|hydrangea|peony|lilac|camellia|gardenia|magnolia|bougainvillea|crape\s+myrtle|tulip|daisy|geranium|begonia|dahlia|zinnia|bloom/.test(t)) return "flower";
  if (/boxwood|hedge|shrub|holly|privet|manzanita/.test(t)) return "shrub";
  if (/maple|oak|pine|cedar|birch|redwood|cypress|\btree\b/.test(t)) return "fruit-tree";
  if (/monstera|pothos|philodendron|ficus|snake\s+plant|peace\s+lily|zz\s+plant|fern|indoor|houseplant/.test(t)) return "houseplant";
  return "houseplant";
}

export function getCategoryArtwork(category: ArtworkCategory): string {
  return CATEGORY_ARTWORK[category] ?? GENERIC_PLANT_ARTWORK;
}

/** Best PlantPal artwork for a plant: species artwork → category artwork → generic. */
export function getArtworkForText(
  text: string,
  placeholderType?: PlaceholderImageType | null
): string {
  const species = getSpeciesArtwork(text);
  if (species) return species;
  if (placeholderType) return getCategoryArtwork(categoryFromPlaceholderType(placeholderType));
  return getCategoryArtwork(inferArtworkCategory(text));
}

export function isArtworkUrl(url: string): boolean {
  return url.startsWith("/artwork/");
}

export interface PlantDisplayImage {
  /** Image to render. Never empty. */
  src: string;
  /** Guaranteed-local fallback if `src` fails to load. */
  fallbackSrc: string;
  /** True when src is PlantPal artwork rather than a photo. */
  isArtwork: boolean;
}

/**
 * Choose the display image for a plant:
 * user photo → species artwork → remote species photo → category artwork → generic.
 */
export function getPlantDisplayImage(plant: {
  name: string;
  species: string;
  image: string;
  photoStatus: PhotoStatus;
  placeholderImageType?: PlaceholderImageType | null;
}): PlantDisplayImage {
  const text = `${plant.name} ${plant.species}`;
  const artwork = getArtworkForText(text, plant.placeholderImageType);
  const image = plant.image ?? "";
  const isLegacyPlaceholder = image.startsWith("data:image/svg+xml");
  const isRealUrl =
    !isLegacyPlaceholder &&
    !isArtworkUrl(image) &&
    (image.startsWith("http") || image.startsWith("data:") || image.startsWith("blob:"));

  // 1. User photo always wins.
  if (plant.photoStatus === "real_photo" && isRealUrl) {
    return { src: image, fallbackSrc: artwork, isArtwork: false };
  }

  // 2. PlantPal species artwork (guaranteed to load, looks like the plant).
  const speciesArt = getSpeciesArtwork(text);
  if (speciesArt) {
    return { src: speciesArt, fallbackSrc: GENERIC_PLANT_ARTWORK, isArtwork: true };
  }

  // 3. Remote species photo (Perenual / plant database).
  if (isRealUrl) {
    return { src: image, fallbackSrc: artwork, isArtwork: false };
  }

  // 4–5. Category artwork → generic.
  return { src: artwork, fallbackSrc: GENERIC_PLANT_ARTWORK, isArtwork: true };
}
