import type { MetadataRoute } from "next";
import { APP_ICON_PATHS, BRAND } from "@/lib/brand/tokens";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "PlantPal. Grow with confidence.",
    short_name: "PlantPal",
    description: BRAND.appStoreDescription,
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    background_color: "#2D6A4F",
    theme_color: "#2D6A4F",
    orientation: "portrait-primary",
    categories: ["lifestyle", "utilities", "education"],
    lang: "en-US",
    dir: "ltr",
    prefer_related_applications: false,
    icons: [
      {
        src: APP_ICON_PATHS.png192,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: APP_ICON_PATHS.png512,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: APP_ICON_PATHS.android192,
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: APP_ICON_PATHS.android512,
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
        icons: [{ src: APP_ICON_PATHS.png192, sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Scan Plant",
        short_name: "Scan",
        url: "/scanner",
        icons: [{ src: APP_ICON_PATHS.png192, sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
