import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: commentId } = await params;
    const body = await request.json().catch(() => ({}));
    const anonUserId: string | null = body?.anonUserId || null;

    const { userId: clerkUserId } = await auth();
    let user_id: string;
    let user_type: "clerk" | "anonymous";
    if (clerkUserId) {
      user_id = clerkUserId;
      user_type = "clerk";
    } else if (anonUserId) {
      user_id = anonUserId;
      user_type = "anonymous";
    } else {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // toggle like
    const { data: existing } = await supabase
      .from("confessions_comment_likes")
      .select("id")
      .eq("comment_id", commentId)
      .eq("user_id", user_id)
      .eq("user_type", user_type)
      .maybeSingle();

    if (existing) {
      // Unlike
      const { error: delErr } = await supabase.from("confessions_comment_likes").delete().eq("id", existing.id);
      if (delErr) {
        console.error("Failed to unlike comment due to RLS or other error:", delErr);
        return NextResponse.json({ error: "Failed to unlike comment" }, { status: 500 });
      }
    } else {
      const { error: insErr } = await supabase.from("confessions_comment_likes").insert({ comment_id: commentId, user_id, user_type });
      if (insErr) {
        console.error("Failed to like comment:", insErr);
        return NextResponse.json({ error: "Failed to like comment" }, { status: 500 });
      }
    }

    const { count } = await supabase
      .from("confessions_comment_likes")
      .select("*", { count: "exact", head: true })
      .eq("comment_id", commentId);

    return NextResponse.json({ likes_count: count || 0, liked: !existing });
  } catch (e) {
    console.error("Error toggling comment like:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: commentId } = await params;
    const { userId: clerkUserId } = await auth();
    const body = await request.json().catch(() => ({}));
    const anonUserId: string | null = body?.anonUserId || null;

    let user_id: string;
    let user_type: "clerk" | "anonymous";
    if (clerkUserId) {
      user_id = clerkUserId;
      user_type = "clerk";
    } else if (anonUserId) {
      user_id = anonUserId;
      user_type = "anonymous";
    } else {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { error: delErr2 } = await supabase
      .from("confessions_comment_likes")
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", user_id)
      .eq("user_type", user_type);
    if (delErr2) {
      console.error("Failed to unlike comment:", delErr2);
      return NextResponse.json({ error: "Failed to unlike comment" }, { status: 500 });
    }

    const { count } = await supabase
      .from("confessions_comment_likes")
      .select("*", { count: "exact", head: true })
      .eq("comment_id", commentId);

    return NextResponse.json({ likes_count: count || 0, liked: false });
  } catch (e) {
    console.error("Error unliking comment:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


