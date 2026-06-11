import type { Metadata } from "next";
import { MarketingHomePage } from "@/components/marketing/marketing-home-page";
import { absoluteUrl, OG_IMAGE, SITE_DESCRIPTION, SITE_TITLE } from "@/lib/marketing/site";

export const metadata: Metadata = {
  title: { absolute: SITE_TITLE },
  description: SITE_DESCRIPTION,
  alternates: { canonical: absoluteUrl("/") },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: absoluteUrl("/"),
    images: [OG_IMAGE],
  },
};

export default function HomePage() {
  return <MarketingHomePage />;
}
