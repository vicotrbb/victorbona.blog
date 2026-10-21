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
  const summary = param("summary");
  const meta = [
    safeFormatDate(publishedAt),
    readingTime && `${readingTime} min read`,
  ].filter(Boolean);

  const [sans, sansBold, mono] = await fonts;

  return new ImageResponse(
    (
      <div
        tw="flex h-full w-full flex-col px-20 py-16"
        style={{ backgroundColor: colors.bg, color: colors.text, fontFamily: "Sans" }}
      >
        <div tw="flex text-2xl" style={{ fontFamily: "Mono", color: colors.dim }}>
          {kicker}
        </div>

        <div tw="flex flex-1 flex-col justify-center">
          <div
            tw="flex"
            style={{
              fontWeight: 600,
              fontSize: title.length > 110 ? 50 : title.length > 60 ? 60 : 76,
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
              maxWidth: 1000,
            }}
          >
            {title}
          </div>
          {summary && (
            <div
              tw="mt-6 flex text-3xl"
              style={{ color: colors.dim, lineHeight: 1.3, maxWidth: 940, lineClamp: 2 }}
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

        <div tw="flex w-full" style={{ height: 2, backgroundColor: colors.lit }} />
        <div tw="mt-6 flex items-baseline text-2xl">
          <span style={{ fontWeight: 600 }}>{profile.name}</span>
          <span tw="ml-5" style={{ color: colors.dim }}>
            {profile.oneLiner}
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
