/** Canonical marketing site config. Single source of truth for SEO and social. */

export const SITE_URL = "https://getplantpal.com";

export const SITE_NAME = "PlantPal";

export const SITE_TITLE = "PlantPal | Stop Killing Your Plants";

export const SITE_DESCRIPTION =
  "PlantPal helps you identify plants, diagnose problems, get care plans, and grow with confidence.";

export const OG_IMAGE = `${SITE_URL}/icon-512.png`;

export const SUPPORT_EMAIL = "support@plantpal.app";

export const SOCIAL_LINKS = [
  {
    id: "instagram",
    label: "Instagram",
    handle: "@plantpalhq",
    url: "https://instagram.com/plantpalhq",
  },
  {
    id: "x",
    label: "X",
    handle: "@getplantpal",
    url: "https://x.com/getplantpal",
  },
  {
    id: "tiktok",
    label: "TikTok",
    handle: "@getplantpal",
    url: "https://tiktok.com/@getplantpal",
  },
] as const;

export type SocialId = (typeof SOCIAL_LINKS)[number]["id"];

/** Absolute URL helper for canonical/OG tags. */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
