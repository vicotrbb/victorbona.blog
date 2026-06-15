import "katex/dist/katex.min.css";
import "./global.css";
import type { Metadata } from "next";
import { Atkinson_Hyperlegible, Libre_Caslon_Text } from "next/font/google";
import { Navbar } from "./components/nav";
import { Analytics } from "@vercel/analytics/react";
import Footer from "./components/footer";
import { baseUrl } from "./sitemap";
import Script from "next/script";
import { PageViewTracker } from "./components/page-view-tracker";
import {
  getBlogJsonLd,
  getPersonJsonLd,
  getWebsiteJsonLd,
  withDefaultOpenGraphImage,
  withDefaultTwitterImage,
} from "./lib/seo";

const display = Libre_Caslon_Text({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-display-serif",
});

const body = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-body-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Victor Bona Blog",
    template: "%s | Victor Bona Blog",
  },
  icons: {
    icon: [
      { url: "/logos/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/logos/favicon-96.png", sizes: "96x96", type: "image/png" },
      { url: "/logos/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/logos/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/logos/site.webmanifest",
  description:
    "Victor Bona writes about production software, architecture, infrastructure, security, AI systems, and the tradeoffs behind shipped engineering work.",
  keywords: [
    "full-stack developer",
    "engineering",
    "software architecture",
    "cloud engineering",
    "tech",
    "software",
    "software engineer",
    "web development",
    "React",
    "TypeScript",
    "Node.js",
    "portfolio",
    "blog",
  ],
  authors: [{ name: "Victor Bona" }],
  creator: "Victor Bona",
  openGraph: withDefaultOpenGraphImage({
    title: "Victor Bona Blog",
    description:
      "Victor Bona writes about production software, architecture, infrastructure, security, AI systems, and the tradeoffs behind shipped engineering work.",
    url: baseUrl,
    siteName: "Victor Bona Blog",
    locale: "en_US",
    type: "website",
  }),
  twitter: withDefaultTwitterImage({
    card: "summary_large_image",
    title: "Victor Bona Blog",
    description:
      "Victor Bona writes about production software, architecture, infrastructure, security, AI systems, and the tradeoffs behind shipped engineering work.",
    creator: "@BonaVictor",
  }),
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // google: "your-google-site-verification",
    // yandex: "your-yandex-verification",
    // bing: "your-bing-verification",
  },
  alternates: {
    canonical: baseUrl,
  },
  category: "technology",
  other: {
    // "google-site-verification": "your-google-verification-code",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

const cx = (...classes) => classes.filter(Boolean).join(" ");

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteJsonLd = [getPersonJsonLd(), getWebsiteJsonLd(), getBlogJsonLd()];

  return (
    <html lang="en" className={cx(display.variable, body.variable)}>
      <head>
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(siteJsonLd),
          }}
        />
        <Script
          defer
          data-website-id="683fc4e7e5c802d499876375"
          data-domain="blog.vicotrbb.dev"
          src="/js/script.js"
          strategy="afterInteractive"
        ></Script>
        <Script
          src="https://cdn.himetrica.com/tracker.js"
          data-api-key="hm_3b2d85c927c1d62a2794dcda0729c270dd60efa5a17d3674"
          strategy="afterInteractive"
        />
      </head>
      <body className="antialiased">
        <PageViewTracker />
        <main className="mx-auto flex min-h-screen w-full max-w-[var(--max-shell)] flex-col px-4 py-4 sm:px-6 lg:px-8">
          <Navbar />
          <div className="flex-auto">{children}</div>
          <Footer />
          <Analytics />
        </main>
      </body>
    </html>
  );
}
