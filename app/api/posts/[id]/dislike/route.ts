import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";

// POST - Dislike a post
// DELETE - Remove dislike from a post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();
    const { id: postId } = await params;
    const body = await request.json();
    const { anonUserId, anonUserType } = body;

    // Determine user ID and type
    let userId: string;
    let userType: "clerk" | "anonymous";

    if (clerkUserId) {
      userId = clerkUserId;
      userType = "clerk";
    } else if (anonUserId) {
      userId = anonUserId;
      userType = "anonymous";
    } else {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // Check if user already liked this post - remove like first
    const { data: existingLike, error: likeError } = await supabase
      .from("confessions_likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .eq("user_type", userType)
      .maybeSingle();

    if (existingLike && !likeError) {
      await supabase
        .from("confessions_likes")
        .delete()
        .eq("id", existingLike.id);
    }

    // Check if already disliked
    const { data: existingDislike, error: dislikeError } = await supabase
      .from("confessions_dislikes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .eq("user_type", userType)
      .maybeSingle();

    if (existingDislike && !dislikeError) {
      // Already disliked, so remove dislike
      await supabase
        .from("confessions_dislikes")
        .delete()
        .eq("id", existingDislike.id);
      return NextResponse.json({ disliked: false });
    }

    // Add dislike
    const { error } = await supabase
      .from("confessions_dislikes")
      .insert({
        post_id: postId,
        user_id: userId,
        user_type: userType,
      });

    if (error) {
      console.error("Error disliking post:", error);
      return NextResponse.json(
        { error: "Failed to dislike post" },
        { status: 500 }
      );
    }

    return NextResponse.json({ disliked: true });
  } catch (error) {
    console.error("Error in POST /api/posts/[id]/dislike:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

