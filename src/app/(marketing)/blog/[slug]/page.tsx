import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/marketing/structured-data";
import { WaitlistCta } from "@/components/marketing/waitlist-cta";
import { PlantyTip } from "@/components/brand/planty";
import {
  getAllPosts,
  getPlantyTipForPost,
  getPostBySlug,
  getReadingTime,
  getRelatedPosts,
} from "@/lib/blog/posts";
import { absoluteUrl, OG_IMAGE, SITE_NAME } from "@/lib/marketing/site";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  const url = absoluteUrl(`/blog/${post.slug}`);
  return {
    title: post.title,
    description: post.description,
    keywords: post.tags,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url,
      publishedTime: post.date,
      authors: [post.author],
      images: [post.featuredImage ? absoluteUrl(post.featuredImage) : OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

function slugifyHeading(heading: string): string {
  return heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function formatDate(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const related = getRelatedPosts(post.slug);
  const readingTime = getReadingTime(post);
  const showToc = post.sections.length >= 4;
  const url = absoluteUrl(`/blog/${post.slug}`);

  const structuredData: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.description,
      datePublished: post.date,
      author: { "@type": "Organization", name: post.author },
      publisher: { "@type": "Organization", name: SITE_NAME, logo: { "@type": "ImageObject", url: OG_IMAGE } },
      mainEntityOfPage: url,
      image: post.featuredImage ? absoluteUrl(post.featuredImage) : OG_IMAGE,
      keywords: post.tags.join(", "),
    },
  ];
  if (post.faqs.length > 0) {
    structuredData.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: post.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    });
  }

  return (
    <div className="py-16 sm:py-24">
      <JsonLd data={structuredData} />

      <article className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <header>
          <p className="text-xs font-semibold text-brand-primary uppercase tracking-wide">
            <Link href="/blog" className="hover:underline">
              Blog
            </Link>{" "}
            · {post.category}
          </p>
          <h1 className="font-heading text-3xl sm:text-5xl font-bold text-brand-text tracking-tight leading-[1.1] mt-3">
            {post.title}
          </h1>
          <p className="text-sm text-brand-text-secondary mt-4">
            {post.author} · {formatDate(post.date)} · {readingTime} min read
          </p>
        </header>

        {/* Featured visual */}
        <div className="mt-8 h-48 sm:h-64 rounded-3xl bg-brand-sage/15 border border-brand-sage/25 flex items-center justify-center">
          <Leaf className="w-12 h-12 text-brand-primary/50" />
        </div>

        {/* Intro */}
        <p className="text-lg text-brand-text-secondary leading-relaxed mt-8">{post.intro}</p>

        {/* Planty tip */}
        <PlantyTip tip={getPlantyTipForPost(post)} className="mt-8" />

        {/* Table of contents */}
        {showToc && (
          <nav className="mt-8 bg-white rounded-2xl border border-brand-sage/25 p-6" aria-label="Table of contents">
            <p className="font-heading font-bold text-brand-text text-sm uppercase tracking-wide mb-3">
              In this guide
            </p>
            <ol className="space-y-2">
              {post.sections.map((section) => (
                <li key={section.heading}>
                  <a
                    href={`#${slugifyHeading(section.heading)}`}
                    className="text-sm text-brand-primary hover:underline"
                  >
                    {section.heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        {/* Sections */}
        <div className="mt-4">
          {post.sections.map((section) => (
            <section key={section.heading} className="mt-10">
              <h2
                id={slugifyHeading(section.heading)}
                className="font-heading text-2xl font-bold text-brand-text tracking-tight scroll-mt-24"
              >
                {section.heading}
              </h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 40)} className="text-brand-text-secondary leading-relaxed mt-4">
                  {paragraph}
                </p>
              ))}
              {section.list && (
                <ul className="mt-4 space-y-2.5">
                  {section.list.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-brand-text-secondary">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-growth mt-2.5 shrink-0" />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        {/* CTA box */}
        <aside className="mt-14 bg-brand-primary rounded-3xl p-8 sm:p-10 text-center text-white">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">
            Sick plant? Stop guessing.
          </h2>
          <p className="text-brand-sage mt-3">Scan it with PlantPal.</p>
          <Link href="/onboarding" className="inline-block mt-6">
            <Button
              variant="secondary"
              size="lg"
              className="min-w-[200px] h-14 bg-white text-brand-primary hover:bg-brand-bg text-base"
            >
              Try PlantPal Free
            </Button>
          </Link>
        </aside>

        {/* FAQ */}
        {post.faqs.length > 0 && (
          <section className="mt-14">
            <h2 className="font-heading text-2xl font-bold text-brand-text tracking-tight">
              FAQ
            </h2>
            <div className="mt-6 space-y-4">
              {post.faqs.map((faq) => (
                <div key={faq.question} className="bg-white rounded-2xl border border-brand-sage/25 p-6">
                  <h3 className="font-heading font-bold text-brand-text">{faq.question}</h3>
                  <p className="text-sm text-brand-text-secondary mt-2 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tags */}
        <div className="mt-10 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-3 py-1.5 rounded-full bg-brand-sage/15 text-brand-text-secondary"
            >
              {tag}
            </span>
          ))}
        </div>
      </article>

      {/* Related posts */}
      {related.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-20">
          <h2 className="font-heading text-2xl font-bold text-brand-text tracking-tight mb-6">
            Keep reading
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {related.map((relatedPost) => (
              <Link
                key={relatedPost.slug}
                href={`/blog/${relatedPost.slug}`}
                className="block bg-white rounded-2xl border border-brand-sage/25 shadow-sm p-6 hover:shadow-md hover:border-brand-sage transition-all"
              >
                <p className="text-xs font-semibold text-brand-primary uppercase tracking-wide">
                  {relatedPost.category}
                </p>
                <h3 className="font-heading font-bold text-brand-text mt-2 leading-snug">
                  {relatedPost.title}
                </h3>
                <p className="text-sm text-brand-text-secondary mt-2 leading-relaxed line-clamp-2">
                  {relatedPost.description}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <WaitlistCta
        heading="Join the beta before your fiddle leaf gives up."
        source={`blog-${post.slug}`}
        className="mt-20"
      />
    </div>
  );
}
