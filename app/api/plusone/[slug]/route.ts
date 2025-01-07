import { fetchPostLikes, plusOnePostLike } from "lib/db";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const count = await fetchPostLikes(params.slug);
  return Response.json({ count });
}

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  await plusOnePostLike(params.slug);
  return new Response(null, { status: 200 });
}
