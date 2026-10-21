import "katex/dist/katex.min.css";
import "./global.css";
import type { Metadata } from "next";
import { Martian_Mono, Schibsted_Grotesk } from "next/font/google";
import { Navbar } from "./components/nav";
import { Terminal } from "./components/Terminal";
import { BootLine } from "./components/BootLine";
import { getTerminalIndex } from "./lib/terminal-index";
import { getSiteCounts } from "./lib/counts";
import { Analytics } from "@vercel/analytics/react";
import Footer from "./components/footer";
import { baseUrl } from "./sitemap";
import { profile } from "./lib/profile";
import Script from "next/script";
import { PageViewTracker } from "./components/page-view-tracker";
import {
  getBlogJsonLd,
  getPersonJsonLd,
  getWebsiteJsonLd,
  withDefaultOpenGraphImage,
  withDefaultTwitterImage,
} from "./lib/seo";

const sans = Schibsted_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
});

const mono = Martian_Mono({
  subsets: ["latin"],
  weight: "variable",
  variable: "--font-mono",
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
    `${profile.oneLiner}. Writing about production software, distributed systems, infrastructure, security, and AI systems.`,
  keywords: [
    "distributed systems",
    "senior software engineer",
    "AI systems",
    "site reliability",
    "engineering",
    "software architecture",
    "cloud engineering",
    "tech",
    "software",
    "software engineer",
    "web development",
    "TypeScript",
    "Node.js",
    "blog",
  ],
  authors: [{ name: "Victor Bona" }],
  creator: "Victor Bona",
  openGraph: withDefaultOpenGraphImage({
    title: "Victor Bona Blog",
    description:
      `${profile.oneLiner}. Writing about production software, distributed systems, infrastructure, security, and AI systems.`,
    url: baseUrl,
    siteName: "Victor Bona Blog",
    locale: "en_US",
    type: "website",
  }),
  twitter: withDefaultTwitterImage({
    card: "summary_large_image",
    title: "Victor Bona Blog",
    description:
      `${profile.oneLiner}. Writing about production software, distributed systems, infrastructure, security, and AI systems.`,
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteJsonLd = [getPersonJsonLd(), getWebsiteJsonLd(), getBlogJsonLd()];
  const counts = getSiteCounts();

  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
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
      <body className="flex min-h-screen flex-col antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-[var(--bg)] focus:px-3 focus:py-2 focus:font-mono focus:text-sm focus:text-[var(--lit)]"
        >
          Skip to content
        </a>
        <PageViewTracker />
        <Navbar />
        <BootLine systems={counts.systems} papers={counts.papers} />
        <main id="main" className="w-full flex-auto">
          {children}
        </main>
        <Footer />
        <Terminal index={getTerminalIndex()} />
        <Analytics />
      </body>
    </html>
  );
}
