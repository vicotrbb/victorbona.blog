import { ImageResponse } from "next/og";
import { formatDate } from "app/blog/utils";

export function GET(request: Request) {
  const url = new URL(request.url);
  const title = url.searchParams.get("title") || "Victor Bona Blog";
  const publishedAt = url.searchParams.get("publishedAt");
  const readingTime = url.searchParams.get("readingTime");
  const summary = url.searchParams.get("summary");

  return new ImageResponse(
    (
      <div
        tw="flex flex-col w-full h-full items-center justify-center"
        style={{
          background: "linear-gradient(to bottom right, #1a1a1a, #2d2d2d)",
        }}
      >
        <div tw="flex flex-col w-full h-full px-16 py-12">
          {/* Header */}
          <div tw="flex text-zinc-400 text-2xl mb-6">Victor Bona</div>

          {/* Main content */}
          <div tw="flex flex-col flex-1 justify-center space-y-4">
            <h1 tw="text-5xl font-bold tracking-tight text-white max-w-4xl">
              {title}
            </h1>

            {summary && (
              <p tw="text-lg text-zinc-400 max-w-4xl line-clamp-2">{summary}</p>
            )}

            {/* Metadata row */}
            <div tw="flex flex-row items-center space-x-4 text-zinc-400">
              {publishedAt && <p tw="text-lg">{formatDate(publishedAt)}</p>}
              {readingTime && (
                <>
                  <span tw="text-lg">•</span>
                  <p tw="text-lg">{readingTime} min read</p>
                </>
              )}
            </div>
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
