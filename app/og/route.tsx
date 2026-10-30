import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { formatDate } from "app/blog/utils";
import { profile } from "app/lib/profile";

const colors = {
  bg: "#020604",
  text: "#d8e8de",
  dim: "#6f8f7c",
  lit: "#4dff8f",
  line: "#0a1610",
  lineStrong: "#1f5c3a",
  watermark: "#0c1f14",
};

// Static TTF instances from Google Fonts (satori cannot read woff2 or variable fonts).
// public/ ships next to the standalone server, so cwd-relative reads work in dev and Docker.
const fontDir = path.join(process.cwd(), "public", "fonts", "og");
const fonts = Promise.all([
  readFile(path.join(fontDir, "SchibstedGrotesk-400.ttf")),
  readFile(path.join(fontDir, "SchibstedGrotesk-600.ttf")),
  readFile(path.join(fontDir, "MartianMono-400.ttf")),
]);

// Public endpoint: clip free-text params so oversized queries cannot blow up the layout.
const maxTextLength = 200;

// satori ignores lineClamp, so cut long summaries at a word to stay within three lines.
const maxSummaryLength = 180;

function clipSummary(value: string | null) {
  if (!value || value.length <= maxSummaryLength) return value;
  const cut = value.slice(0, maxSummaryLength);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[\s,.;:]+$/, "")}…`;
}

function safeFormatDate(value: string | null) {
  if (!value) return null;
  try {
    return formatDate(value);
  } catch {
    return null; // invalid date: omit it rather than 500
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const param = (name: string) => url.searchParams.get(name)?.slice(0, maxTextLength) || null;
  const title = param("title") || "Victor Bona";
  const kicker = param("kicker") || "P100 Home";
  const publishedAt = param("publishedAt");
  const readingTime = param("readingTime");
  const summary = clipSummary(param("summary"));
  const meta = [
    safeFormatDate(publishedAt),
    readingTime && `${readingTime} min read`,
  ].filter(Boolean);

  const [sans, sansBold, mono] = await fonts;

  // Address code ("P300") becomes a faint watermark; non-address kickers like "press --kit" get none.
  const code = kicker.match(/^P\d00/)?.[0];
  const isHome = title === profile.name;

  return new ImageResponse(
    (
      <div
        tw="relative flex h-full w-full flex-col px-20 py-14"
        style={{
          backgroundColor: colors.bg,
          backgroundImage: `radial-gradient(circle at 92% 108%, rgba(77,255,143,0.16), transparent 45%), linear-gradient(${colors.line} 1px, transparent 1px), linear-gradient(90deg, ${colors.line} 1px, transparent 1px)`,
          backgroundSize: "100% 100%, 48px 48px, 48px 48px",
          color: colors.text,
          fontFamily: "Sans",
        }}
      >
        {code && (
          <div
            tw="absolute flex"
            style={{ right: 56, top: 150, fontFamily: "Mono", fontSize: 220, color: colors.watermark, letterSpacing: "-0.04em" }}
          >
            {code}
          </div>
        )}

        <div
          tw="flex items-center justify-between pb-6 text-2xl"
          style={{ fontFamily: "Mono", borderBottom: `1px solid ${colors.lineStrong}` }}
        >
          <div tw="flex items-center">
            <div tw="flex" style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: colors.lit, boxShadow: `0 0 16px ${colors.lit}` }} />
            <span tw="ml-4">victor-bona</span>
          </div>
          <span style={{ color: colors.dim }}>{kicker}</span>
        </div>

        <div tw="mb-8 flex flex-1 flex-col justify-center">
          <div
            tw="flex"
            style={{
              fontWeight: 600,
              fontSize: title.length > 110 ? 50 : title.length > 60 ? 60 : 80,
              lineHeight: 1.06,
              letterSpacing: "-0.03em",
              maxWidth: 1000,
            }}
          >
            {title}
          </div>
          {summary && (
            <div
              tw="mt-6 flex text-3xl"
              style={{ color: colors.dim, lineHeight: 1.3, maxWidth: 940 }}
            >
              {summary}
            </div>
          )}
          {meta.length > 0 && (
            <div tw="mt-6 flex text-xl" style={{ fontFamily: "Mono", color: colors.dim }}>
              {meta.join("  /  ")}
            </div>
          )}
        </div>

        <div tw="flex w-full" style={{ height: 2, backgroundColor: colors.lit, boxShadow: `0 0 18px ${colors.lit}` }} />
        <div tw="mt-6 flex items-baseline justify-between text-2xl">
          {/* The home card's title is already the name, so its footer carries the role instead. */}
          <span style={isHome ? { color: colors.dim } : { fontWeight: 600 }}>
            {isHome ? `${profile.timeline[0].role} @ ${profile.worksFor}` : profile.name}
          </span>
          <span tw="text-xl" style={{ fontFamily: "Mono", color: colors.dim }}>
            blog.victorbona.dev
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Sans", data: sans, weight: 400, style: "normal" },
        { name: "Sans", data: sansBold, weight: 600, style: "normal" },
        { name: "Mono", data: mono, weight: 400, style: "normal" },
      ],
    }
  );
}
