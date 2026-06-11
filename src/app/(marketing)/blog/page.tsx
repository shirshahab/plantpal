import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts, getReadingTime } from "@/lib/blog/posts";
import { WaitlistCta } from "@/components/marketing/waitlist-cta";
import { absoluteUrl, OG_IMAGE } from "@/lib/marketing/site";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Plant care guides, problem fixes, and local growing tips. Short, useful, and zero fluff.",
  alternates: { canonical: absoluteUrl("/blog") },
  openGraph: {
    title: "PlantPal Blog",
    description:
      "Plant care guides, problem fixes, and local growing tips. Short, useful, and zero fluff.",
    url: absoluteUrl("/blog"),
    images: [OG_IMAGE],
  },
};

function formatDate(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <div className="py-16 sm:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h1 className="font-heading text-4xl sm:text-6xl font-bold text-brand-text tracking-tight leading-[1.05]">
            The PlantPal Blog
          </h1>
          <p className="text-lg text-brand-text-secondary mt-5 leading-relaxed">
            Plant care without the lecture. Short guides for keeping things alive.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {posts.map((post) => (
            <article key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="block h-full bg-white rounded-2xl border border-brand-sage/25 shadow-sm p-6 hover:shadow-md hover:border-brand-sage transition-all"
              >
                <p className="text-xs font-semibold text-brand-primary uppercase tracking-wide">
                  {post.category}
                </p>
                <h2 className="font-heading text-lg font-bold text-brand-text mt-2 leading-snug">
                  {post.title}
                </h2>
                <p className="text-sm text-brand-text-secondary mt-2 leading-relaxed">
                  {post.description}
                </p>
                <p className="text-xs text-brand-text-secondary mt-4">
                  {formatDate(post.date)} · {getReadingTime(post)} min read
                </p>
              </Link>
            </article>
          ))}
        </div>
      </div>

      <WaitlistCta
        heading="Join the beta before your fiddle leaf gives up."
        source="blog-index"
        className="mt-20"
      />
    </div>
  );
}
