import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { pgTable, text, timestamp, serial, integer } from "drizzle-orm/pg-core";
import { count, eq } from "drizzle-orm";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle({ client: sql });

export const postLikes = pgTable("post_likes", {
  id: serial("id").primaryKey(),
  postSlug: text("post_slug").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const fetchPostLikes = async (postSlug: string) => {
  try {
    const likes = await db
      .select({ count: count() })
      .from(postLikes)
      .where(eq(postLikes.postSlug, postSlug))
      .execute();

    return likes[0]?.count ?? 0;
  } catch (error) {
    console.error("Error fetching post likes:", error);
    return 0;
  }
};

export const plusOnePostLike = async (postSlug: string) => {
  try {
    await db
      .insert(postLikes)
      .values({ postSlug })
      .onConflictDoNothing()
      .execute();
  } catch (error) {
    console.error("Error updating post likes:", error);
  }
};
