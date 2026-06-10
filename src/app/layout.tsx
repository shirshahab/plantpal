import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { APP_ICON_PATHS } from "@/lib/brand/tokens";
import { SentryLoader } from "@/components/monitoring/sentry-loader";
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
    startupImage: [
      {
        url: "/splash-750x1334.png",
        media:
          "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "/splash-1170x2532.png",
        media:
          "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/splash-1290x2796.png",
        media:
          "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/splash-1536x2048.png",
        media:
          "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)",
      },
    ],
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: APP_ICON_PATHS.favicon16, sizes: "16x16", type: "image/png" },
      { url: APP_ICON_PATHS.favicon32, sizes: "32x32", type: "image/png" },
      { url: APP_ICON_PATHS.svg, type: "image/svg+xml" },
    ],
    shortcut: APP_ICON_PATHS.favicon32,
    apple: [{ url: APP_ICON_PATHS.appleTouch, sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#2D6A4F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  // Android: resize the viewport when the keyboard opens so sticky
  // footers and focused inputs stay visible above the keyboard.
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakarta.variable} h-full antialiased`}>
      <body className="min-h-full overscroll-none">
        <SentryLoader />
        {children}
      </body>
    </html>
  );
}
