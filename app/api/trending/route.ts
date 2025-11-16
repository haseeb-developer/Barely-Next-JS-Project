import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

// GET - Get trending tags (tags used 20+ times)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get all posts with tags
    const { data: posts, error } = await supabase
      .from("confessions_posts")
      .select("tags")
      .not("tags", "is", null);

    if (error) {
      console.error("Error fetching posts for trending:", error);
      return NextResponse.json(
        { error: "Failed to fetch trending tags" },
        { status: 500 }
      );
    }

    // Count tag occurrences
    const tagCounts: Record<string, number> = {};
    
    (posts || []).forEach((post) => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach((tag: string) => {
          if (tag && typeof tag === "string") {
            const normalizedTag = tag.toLowerCase().trim();
            if (normalizedTag) {
              tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1;
            }
          }
        });
      }
    });

    // Filter tags that have 20+ uses and sort by count
    const trendingTags = Object.entries(tagCounts)
      .filter(([_, count]) => count >= 20)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);

    // Get posts for each trending tag
    const trendingData = await Promise.all(
      trendingTags.map(async ({ tag, count }) => {
        // Get posts with this tag
        const { data: tagPosts } = await supabase
          .from("confessions_posts")
          .select(`
            id,
            content,
            username,
            user_id,
            user_type,
            created_at,
            tags
          `)
          .contains("tags", [tag]);

        // Get likes/dislikes counts for each post
        const postsWithCounts = await Promise.all(
          (tagPosts || []).map(async (post) => {
            const { count: likesCount } = await supabase
              .from("confessions_likes")
              .select("*", { count: "exact", head: true })
              .eq("post_id", post.id);

            const { count: dislikesCount } = await supabase
              .from("confessions_dislikes")
              .select("*", { count: "exact", head: true })
              .eq("post_id", post.id);

            return {
              ...post,
              likes_count: likesCount || 0,
              dislikes_count: dislikesCount || 0,
            };
          })
        );

        return {
          tag,
          count,
          posts: postsWithCounts.slice(0, 10), // Limit to 10 posts per tag
        };
      })
    );

    return NextResponse.json({ trending: trendingData });
  } catch (error) {
    console.error("Error in GET /api/trending:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

