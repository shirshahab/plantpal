import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/marketing/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/debug/", "/setup", "/qa"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
