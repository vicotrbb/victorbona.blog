import "katex/dist/katex.min.css";
import "./global.css";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Navbar } from "./components/nav";
import { Analytics } from "@vercel/analytics/react";
import Footer from "./components/footer";
import { baseUrl } from "./sitemap";
import Script from "next/script";
import { FaroInit } from "./components/faro-init";
import { PageViewTracker } from "./components/page-view-tracker";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Victor Bona Blog",
    template: "%s | Victor Bona Blog",
  },
  icons: {
    icon: "/logo.ico",
  },
  description:
    "A blog about software engineering, software development, software architecture, tech, software, and more.",
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
  openGraph: {
    title: "Victor Bona Blog",
    description:
      "A blog about software engineering, software development, software architecture, tech, software, and more.",
    url: baseUrl,
    siteName: "Victor Bona Blog",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: `${baseUrl}/og`,
        width: 1200,
        height: 630,
        alt: "Victor Bona Blog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Victor Bona Blog",
    description:
      "A blog about software engineering, software development, software architecture, tech, software, and more.",
    creator: "@BonaVictor",
    images: [`${baseUrl}/og`],
  },
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
    languages: {
      "en-US": "/en-US",
    },
  },
  category: "technology",
  other: {
    // "google-site-verification": "your-google-verification-code",
  },
};

const cx = (...classes) => classes.filter(Boolean).join(" ");

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cx(
        "text-black bg-white dark:text-white dark:bg-black",
        GeistSans.variable,
        GeistMono.variable
      )}
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <Script
          defer
          data-website-id="683fc4e7e5c802d499876375"
          data-domain="blog.vicotrbb.dev"
          src="/js/script.js"
          strategy="afterInteractive"
        ></Script>
      </head>
      <body className="antialiased max-w-4xl mx-4 mt-8 lg:mx-auto">
        <PageViewTracker />
        <FaroInit />
        <main className="flex-auto min-w-0 mt-6 flex flex-col px-4 md:px-6 lg:px-8">
          <Navbar />
          {children}
          <Footer />
          <Analytics />
        </main>
      </body>
    </html>
  );
}
