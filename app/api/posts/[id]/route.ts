import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { isAdminEmail } from "@/app/lib/admin";

// DELETE - Delete a post (only by creator)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();
    const { id: postId } = await params;
    const body = await request.json();
    const { anonUserId } = body;

    // Determine user ID
    const userId = clerkUserId || anonUserId;

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // First, check if the post exists
    const { data: post, error: fetchError } = await supabase
      .from("confessions_posts")
      .select("user_id")
      .eq("id", postId)
      .single();

    if (fetchError || !post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    // Admin override (Clerk): allow deletion regardless of ownership
    let isAdmin = false;
    if (clerkUserId) {
      try {
        const user = await currentUser();
        const email = user?.primaryEmailAddress?.emailAddress || null;
        isAdmin = isAdminEmail(email);
      } catch {}
    }

    // If not admin, ensure the requester is the owner
    if (!isAdmin && post.user_id !== userId) {
      return NextResponse.json(
        { error: "Unauthorized: You can only delete your own posts" },
        { status: 403 }
      );
    }

    // Delete the post (cascade will delete likes/dislikes)
    const { error: deleteError } = await supabase
      .from("confessions_posts")
      .delete()
      .eq("id", postId);

    if (deleteError) {
      console.error("Error deleting post:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete post" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/posts/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

