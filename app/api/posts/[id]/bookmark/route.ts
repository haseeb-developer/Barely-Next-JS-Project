import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import { getAnonUserId } from "@/app/lib/anon-auth";

// POST - Toggle bookmark (save/unsave)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: postId } = await params;
    const { userId: clerkUserId } = await auth();
    const body = await request.json().catch(() => ({}));
    const anonUserId = body?.anonUserId as string | null;

    if (!clerkUserId && !anonUserId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = clerkUserId || anonUserId!;
    const userType = clerkUserId ? "clerk" : "anonymous";

    // Check if already saved
    const { data: existing, error: checkError } = await supabase
      .from("saved_posts")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .eq("user_type", userType)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking saved post:", checkError);
      return NextResponse.json(
        { error: "Failed to check saved status" },
        { status: 500 }
      );
    }

    // Check if current user is the post author
    const { data: post, error: postError } = await supabase
      .from("confessions_posts")
      .select("user_id, user_type")
      .eq("id", postId)
      .maybeSingle();

    if (postError) {
      console.error("Error fetching post:", postError);
    }

    const isAuthor = post && 
      post.user_id === userId && 
      post.user_type === userType;

    if (existing) {
      // Unsave
      const { error: deleteError } = await supabase
        .from("saved_posts")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId)
        .eq("user_type", userType);

      if (deleteError) {
        console.error("Error unsaving post:", deleteError);
        return NextResponse.json(
          { error: "Failed to unsave post" },
          { status: 500 }
        );
      }

      // Get updated save count (only for author)
      let saveCount = null;
      if (isAuthor) {
        const { count } = await supabase
          .from("saved_posts")
          .select("*", { count: "exact", head: true })
          .eq("post_id", postId);
        saveCount = count || 0;
      }

      return NextResponse.json({ saved: false, message: "Post unsaved", saveCount });
    } else {
      // Save
      const { error: insertError } = await supabase
        .from("saved_posts")
        .insert({
          post_id: postId,
          user_id: userId,
          user_type: userType,
        });

      if (insertError) {
        console.error("Error saving post:", insertError);
        return NextResponse.json(
          { error: "Failed to save post" },
          { status: 500 }
        );
      }

      // Get updated save count (only for author)
      let saveCount = null;
      if (isAuthor) {
        const { count } = await supabase
          .from("saved_posts")
          .select("*", { count: "exact", head: true })
          .eq("post_id", postId);
        saveCount = count || 0;
      }

      return NextResponse.json({ saved: true, message: "Post saved", saveCount });
    }
  } catch (e: any) {
    console.error("Error in POST bookmark:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Check if post is saved and get save count (only for post author)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: postId } = await params;
    const { userId: clerkUserId } = await auth();
    const searchParams = request.nextUrl.searchParams;
    const anonUserId = searchParams.get("anonUserId");

    if (!clerkUserId && !anonUserId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = clerkUserId || anonUserId!;
    const userType = clerkUserId ? "clerk" : "anonymous";

    // Check if current user saved this post
    const { data: userSaved, error: userError } = await supabase
      .from("saved_posts")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .eq("user_type", userType)
      .maybeSingle();

    if (userError) {
      console.error("Error checking user saved status:", userError);
    }

    // Get total save count
    const { count: saveCount, error: countError } = await supabase
      .from("saved_posts")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId);

    if (countError) {
      console.error("Error counting saves:", countError);
    }

    // Check if current user is the post author
    const { data: post, error: postError } = await supabase
      .from("confessions_posts")
      .select("user_id, user_type")
      .eq("id", postId)
      .maybeSingle();

    if (postError) {
      console.error("Error fetching post:", postError);
    }

    const isAuthor = post && 
      post.user_id === userId && 
      post.user_type === userType;

    return NextResponse.json({
      saved: !!userSaved,
      saveCount: isAuthor ? (saveCount || 0) : null, // Only show count to author
    });
  } catch (e: any) {
    console.error("Error in GET bookmark:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

