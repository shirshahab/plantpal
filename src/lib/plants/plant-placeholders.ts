import type { PlaceholderImageType } from "./plant-size";

const PLACEHOLDER_STYLES: Record<
  PlaceholderImageType,
  { gradient: string; emoji: string; label: string }
> = {
  tree: {
    gradient: "linear-gradient(145deg, #166534 0%, #4ade80 50%, #bbf7d0 100%)",
    emoji: "🌳",
    label: "Tree",
  },
  flower: {
    gradient: "linear-gradient(145deg, #be185d 0%, #f472b6 50%, #fce7f3 100%)",
    emoji: "🌸",
    label: "Flower",
  },
  houseplant: {
    gradient: "linear-gradient(145deg, #065f46 0%, #34d399 50%, #d1fae5 100%)",
    emoji: "🪴",
    label: "Houseplant",
  },
  succulent: {
    gradient: "linear-gradient(145deg, #0d9488 0%, #5eead4 50%, #ccfbf1 100%)",
    emoji: "🌵",
    label: "Succulent",
  },
  vegetable: {
    gradient: "linear-gradient(145deg, #15803d 0%, #86efac 50%, #ecfccb 100%)",
    emoji: "🥬",
    label: "Vegetable",
  },
  bonsai: {
    gradient: "linear-gradient(145deg, #44403c 0%, #78716c 50%, #a8a29e 100%)",
    emoji: "🌲",
    label: "Bonsai",
  },
  shrub: {
    gradient: "linear-gradient(145deg, #3f6212 0%, #84cc16 50%, #ecfccb 100%)",
    emoji: "🌿",
    label: "Shrub",
  },
};

/** SVG data URL for use as plant.image when placeholder is selected. */
export function getPlaceholderImageUrl(type: PlaceholderImageType): string {
  const style = PLACEHOLDER_STYLES[type];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#166534"/>
        <stop offset="100%" style="stop-color:#86efac"/>
      </linearGradient>
    </defs>
    <rect width="800" height="600" fill="url(#g)"/>
    <text x="400" y="280" font-size="120" text-anchor="middle">${style.emoji}</text>
    <text x="400" y="380" font-family="system-ui,sans-serif" font-size="32" fill="white" text-anchor="middle" opacity="0.9">${style.label}</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function getPlaceholderStyle(type: PlaceholderImageType) {
  return PLACEHOLDER_STYLES[type];
}

export function isPlaceholderImageUrl(url: string): boolean {
  return url.startsWith("data:image/svg+xml");
}

export function resolvePlantImageUrl(plant: {
  image: string;
  photoStatus: import("./plant-size").PhotoStatus;
  placeholderImageType: PlaceholderImageType | null;
}): string {
  if (plant.photoStatus === "real_photo" && plant.image && !isPlaceholderImageUrl(plant.image)) {
    return plant.image;
  }
  if (plant.placeholderImageType) {
    return getPlaceholderImageUrl(plant.placeholderImageType);
  }
  if (isPlaceholderImageUrl(plant.image)) return plant.image;
  return plant.image;
}
