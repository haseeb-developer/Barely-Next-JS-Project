import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: postId } = await params;
    const anonUserId = request.nextUrl.searchParams.get("anonUserId");

    const { data, error } = await supabase
      .from("post_reactions")
      .select("emoji, user_id, user_type")
      .eq("post_id", postId);

    if (error) return NextResponse.json({ error: "Failed to fetch reactions" }, { status: 500 });

    const totals: Record<string, number> = {};
    for (const r of data || []) totals[r.emoji] = (totals[r.emoji] || 0) + 1;

    const { userId: clerkUserId } = await auth();
    const userReactions = (data || [])
      .filter((r) =>
        (clerkUserId && r.user_type === "clerk" && r.user_id === clerkUserId) ||
        (anonUserId && r.user_type === "anonymous" && r.user_id === anonUserId)
      )
      .map((r) => r.emoji);

    return NextResponse.json({ totals, userReactions });
  } catch (e) {
    console.error("GET post reactions error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: postId } = await params;
    const body = await request.json().catch(() => ({}));
    const emoji: string = body?.emoji;
    const anonUserId: string | null = body?.anonUserId || null;

    if (!emoji) return NextResponse.json({ error: "emoji required" }, { status: 400 });

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

    const { data: existing } = await supabase
      .from("post_reactions")
      .select("id")
      .eq("post_id", postId)
      .eq("emoji", emoji)
      .eq("user_id", user_id)
      .eq("user_type", user_type)
      .maybeSingle();

    if (existing) {
      const { error: delErr } = await supabase.from("post_reactions").delete().eq("id", existing.id);
      if (delErr) return NextResponse.json({ error: "Failed to remove reaction" }, { status: 500 });
    } else {
      const { error: insErr } = await supabase.from("post_reactions").insert({ post_id: postId, emoji, user_id, user_type });
      if (insErr) return NextResponse.json({ error: "Failed to add reaction" }, { status: 500 });
    }

    const { data, error } = await supabase
      .from("post_reactions")
      .select("emoji, user_id, user_type")
      .eq("post_id", postId);
    if (error) return NextResponse.json({ error: "Failed to refresh reactions" }, { status: 500 });

    const totals: Record<string, number> = {};
    for (const r of data || []) totals[r.emoji] = (totals[r.emoji] || 0) + 1;

    const userReactions = (data || [])
      .filter((r) => r.user_id === user_id && r.user_type === user_type)
      .map((r) => r.emoji);

    return NextResponse.json({ totals, userReactions });
  } catch (e) {
    console.error("POST post reactions error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


