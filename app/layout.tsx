import "./global.css";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Navbar } from "./components/nav";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Footer from "./components/footer";
import { baseUrl } from "./sitemap";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Victor Bona Blog",
    template: "%s | Victor Bona Blog",
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
        url: `${baseUrl}/og-image.png`,
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
    images: [`${baseUrl}/og-image.png`],
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
      <body className="antialiased max-w-xl mx-4 mt-8 lg:mx-auto">
        <main className="flex-auto min-w-0 mt-6 flex flex-col px-2 md:px-0">
          <Navbar />
          {children}
          <Footer />
          <Analytics />
          <SpeedInsights />
        </main>
      </body>
    </html>
  );
}
