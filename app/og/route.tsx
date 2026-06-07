import { ImageResponse } from "next/og";
import { formatDate } from "app/blog/utils";

const colors = {
  background: "#16100d",
  surface: "#221914",
  rule: "#5f5048",
  accent: "#c98263",
  foreground: "#efe7dc",
  muted: "#b5a69a",
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const title = url.searchParams.get("title") || "Victor Bona Blog";
  const publishedAt = url.searchParams.get("publishedAt");
  const readingTime = url.searchParams.get("readingTime");
  const summary = url.searchParams.get("summary");
  const tags = url.searchParams.get("tags")?.split(",").slice(0, 4) || [];

  return new ImageResponse(
    (
      <div
        tw="flex h-full w-full p-12"
        style={{
          backgroundColor: colors.background,
          backgroundImage: `linear-gradient(90deg, rgba(95,80,72,0.22) 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
          color: colors.foreground,
        }}
      >
        <div
          tw="flex h-full w-full flex-col px-8 py-7"
          style={{
            backgroundColor: "rgba(34,25,20,0.32)",
            border: `1px solid ${colors.rule}`,
          }}
        >
          <div tw="flex items-center justify-between">
            <div
              tw="flex text-2xl font-bold"
              style={{ color: colors.accent, letterSpacing: "4px" }}
            >
              [VICTOR BONA]
            </div>
            <img
              src={`${origin}/logos/icon-512.png`}
              width="72"
              height="72"
              alt=""
            />
          </div>

          <div tw="flex flex-1 flex-col justify-center">
            <h1
              tw="m-0 max-w-5xl text-6xl font-bold leading-tight"
              style={{ color: colors.foreground }}
            >
              {title}
            </h1>

            {summary && (
              <p
                tw="mt-6 max-w-4xl text-2xl leading-snug"
                style={{ color: colors.muted }}
              >
                {summary}
              </p>
            )}

            {tags.length > 0 && (
              <div tw="mt-7 flex flex-row flex-wrap">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    tw="mr-3 border px-3 py-1 text-lg"
                    style={{
                      borderColor: colors.rule,
                      color: colors.muted,
                    }}
                  >
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div
            tw="flex flex-row items-center border-t pt-5 text-xl"
            style={{ borderColor: colors.rule, color: colors.muted }}
          >
            {publishedAt && <p tw="m-0">{formatDate(publishedAt)}</p>}
            {publishedAt && readingTime && <span tw="mx-4">/</span>}
            {readingTime && <p tw="m-0">{readingTime} min read</p>}
            {!publishedAt && !readingTime && <p tw="m-0">Software / Systems / Operational Taste</p>}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
