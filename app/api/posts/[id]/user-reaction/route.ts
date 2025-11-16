import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";

// GET - Check if user has liked/disliked a post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();
    const { id: postId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const anonUserId = searchParams.get("anonUserId");

    const userId = clerkUserId || anonUserId;
    const userType = clerkUserId ? "clerk" : "anonymous";

    if (!userId) {
      return NextResponse.json({ liked: false, disliked: false });
    }

    const supabase = await createClient();

    // Check for like
    const { data: like } = await supabase
      .from("confessions_likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .eq("user_type", userType)
      .maybeSingle();

    // Check for dislike
    const { data: dislike } = await supabase
      .from("confessions_dislikes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .eq("user_type", userType)
      .maybeSingle();

    return NextResponse.json({
      liked: !!like,
      disliked: !!dislike,
    });
  } catch (error) {
    console.error("Error in GET /api/posts/[id]/user-reaction:", error);
    return NextResponse.json({ liked: false, disliked: false });
  }
}

