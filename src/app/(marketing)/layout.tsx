import type { Metadata } from "next";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { SiteStructuredData } from "@/components/marketing/structured-data";
import { OG_IMAGE, SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from "@/lib/marketing/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | PlantPal",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "plant care app",
    "plant identification",
    "plant diagnosis",
    "plant doctor app",
    "garden app",
    "houseplant care",
    "fruit tree care",
    "local plant advice",
  ],
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    type: "website",
    siteName: "PlantPal",
    url: SITE_URL,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-brand-bg">
      <SiteStructuredData />
      <MarketingHeader />
      <main className="flex-1 page-enter">{children}</main>
      <MarketingFooter />
    </div>
  );
}
