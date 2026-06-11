import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog/posts";
import { SITE_URL } from "@/lib/marketing/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { path: "/", priority: 1 },
    { path: "/features", priority: 0.9 },
    { path: "/pricing", priority: 0.9 },
    { path: "/waitlist", priority: 0.9 },
    { path: "/blog", priority: 0.8 },
    { path: "/about", priority: 0.7 },
    { path: "/beta", priority: 0.7 },
    { path: "/contact", priority: 0.6 },
    { path: "/partners", priority: 0.6 },
    { path: "/support", priority: 0.5 },
    { path: "/privacy", priority: 0.3 },
    { path: "/terms", priority: 0.3 },
  ].map(({ path, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority,
  }));

  const blogRoutes: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: new Date(`${post.date}T12:00:00Z`),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...blogRoutes];
}
