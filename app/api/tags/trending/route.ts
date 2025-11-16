import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

// GET - Fetch trending tags with counts
export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch all posts with tags
    const { data: posts, error } = await supabase
      .from("confessions_posts")
      .select("tags");

    if (error) {
      console.error("Error fetching posts for tags:", error);
      return NextResponse.json(
        { error: "Failed to fetch tags" },
        { status: 500 }
      );
    }

    // Count tag occurrences across ALL posts (all users combined)
    const tagCounts: Record<string, number> = {};

    (posts || []).forEach((post) => {
      if (post.tags && Array.isArray(post.tags)) {
        // Count each tag occurrence in this post
        post.tags.forEach((tag: string) => {
          const normalizedTag = tag.toLowerCase().trim();
          if (normalizedTag) {
            // Increment count for this tag (counts across all users and all posts)
            tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1;
          }
        });
      }
    });

    // Show all tags (no minimum threshold), sort by count (descending), and limit to 20
    const trendingTags = Object.entries(tagCounts)
      .filter(([_, count]) => count >= 1) // Show tags used at least once
      .map(([tag, count]) => ({
        tag,
        count,
      }))
      .sort((a, b) => b.count - a.count) // Sort by count: highest first
      .slice(0, 20); // Limit to max 20 tags

    return NextResponse.json({ tags: trendingTags });
  } catch (error) {
    console.error("Error in trending tags API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

