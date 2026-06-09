import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { OFFICIAL_APP_ICON } from "@/lib/brand/tokens";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "PlantPal | Grow with confidence.",
  description:
    "PlantPal helps you track every plant, diagnose problems with photos, and get personalized care advice based on where you live.",
  applicationName: "PlantPal",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PlantPal",
    startupImage: OFFICIAL_APP_ICON,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: OFFICIAL_APP_ICON,
    shortcut: OFFICIAL_APP_ICON,
    apple: OFFICIAL_APP_ICON,
  },
};

export const viewport: Viewport = {
  themeColor: "#2D6A4F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakarta.variable} h-full antialiased`}>
      <body className="min-h-full overscroll-none">{children}</body>
    </html>
  );
}
