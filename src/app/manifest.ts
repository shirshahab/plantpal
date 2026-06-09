import type { MetadataRoute } from "next";
import { BRAND, OFFICIAL_APP_ICON } from "@/lib/brand/tokens";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "PlantPal — Grow with confidence.",
    short_name: "PlantPal",
    description: BRAND.appStoreDescription,
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    background_color: "#FAFBF8",
    theme_color: "#2D6A4F",
    orientation: "portrait-primary",
    categories: ["lifestyle", "utilities", "education"],
    lang: "en-US",
    dir: "ltr",
    prefer_related_applications: false,
    icons: [
      {
        src: OFFICIAL_APP_ICON,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: OFFICIAL_APP_ICON,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Today",
        short_name: "Today",
        url: "/today",
        icons: [{ src: OFFICIAL_APP_ICON, sizes: "512x512", type: "image/png" }],
      },
      {
        name: "Scan Plant",
        short_name: "Scan",
        url: "/scanner",
        icons: [{ src: OFFICIAL_APP_ICON, sizes: "512x512", type: "image/png" }],
      },
    ],
  };
}
