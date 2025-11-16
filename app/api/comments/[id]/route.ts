import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createServiceClient } from "@/app/lib/supabase/service";
import { isAdminEmail } from "@/app/lib/admin";

// DELETE: delete a single comment (author or admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabaseAdmin = createServiceClient();
    const { id: commentId } = await params;

    const body = await request.json().catch(() => ({}));
    const anonUserId: string | null = body?.anonUserId || null;

    const { userId: clerkUserId } = await auth();

    // Get comment to validate ownership
    const { data: comment, error } = await supabaseAdmin
      .from("confessions_comments")
      .select("id, user_id, user_type")
      .eq("id", commentId)
      .maybeSingle();

    if (error || !comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Determine current user and admin
    let canDelete = false;
    let isAdmin = false;

    if (clerkUserId) {
      try {
        const cu = await currentUser();
        const primary = cu?.primaryEmailAddress?.emailAddress || cu?.emailAddresses?.[0]?.emailAddress || null;
        isAdmin = isAdminEmail(primary);
        if (comment.user_type === "clerk" && comment.user_id === clerkUserId) canDelete = true;
      } catch {}
    }

    if (anonUserId && comment.user_type === "anonymous" && comment.user_id === anonUserId) {
      canDelete = true;
    }

    if (!canDelete && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error: delErr } = await supabaseAdmin
      .from("confessions_comments")
      .delete()
      .eq("id", commentId);

    if (delErr) {
      console.error("Failed to delete comment:", delErr);
      return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error in DELETE comment:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


