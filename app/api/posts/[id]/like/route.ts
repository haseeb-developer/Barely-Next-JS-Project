import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";

// POST - Like a post
// DELETE - Unlike a post
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

    // Check if user already disliked this post - remove dislike first
    const { data: existingDislike, error: dislikeError } = await supabase
      .from("confessions_dislikes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .eq("user_type", userType)
      .maybeSingle();

    if (existingDislike && !dislikeError) {
      await supabase
        .from("confessions_dislikes")
        .delete()
        .eq("id", existingDislike.id);
    }

    // Check if already liked
    const { data: existingLike, error: likeError } = await supabase
      .from("confessions_likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .eq("user_type", userType)
      .maybeSingle();

    if (existingLike && !likeError) {
      // Already liked, so unlike it
      await supabase
        .from("confessions_likes")
        .delete()
        .eq("id", existingLike.id);
      return NextResponse.json({ liked: false });
    }

    // Add like
    const { error } = await supabase
      .from("confessions_likes")
      .insert({
        post_id: postId,
        user_id: userId,
        user_type: userType,
      });

    if (error) {
      console.error("Error liking post:", error);
      // Check if it's a unique constraint violation (already exists)
      if (error.code === "23505" || error.message?.includes("duplicate")) {
        // Try to fetch and return the existing like
        const { data: existing } = await supabase
          .from("confessions_likes")
          .select("id")
          .eq("post_id", postId)
          .eq("user_id", userId)
          .eq("user_type", userType)
          .maybeSingle();
        
        if (existing) {
          return NextResponse.json({ liked: true });
        }
      }
      return NextResponse.json(
        { error: error.message || "Failed to like post" },
        { status: 500 }
      );
    }

    return NextResponse.json({ liked: true });
  } catch (error) {
    console.error("Error in POST /api/posts/[id]/like:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Unlike a post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();
    const { id: postId } = await params;
    const body = await request.json();
    const { anonUserId, anonUserType } = body;

    const userId = clerkUserId || anonUserId;
    const userType = clerkUserId ? "clerk" : "anonymous";

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("confessions_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId)
      .eq("user_type", userType);

    if (error) {
      console.error("Error unliking post:", error);
      return NextResponse.json(
        { error: "Failed to unlike post" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/posts/[id]/like:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

