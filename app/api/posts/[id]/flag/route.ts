import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import { getAnonUserId } from "@/app/lib/anon-auth";

// POST - Flag a post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { userId: clerkUserId } = await auth();
    const { id: postId } = await params;

    // Get anonymous user ID from request body
    const body = await request.json();
    const anonUserId = body.anonUserId || null;

    // Determine user type and ID
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

    // Check if post exists
    const { data: post, error: postError } = await supabase
      .from("confessions_posts")
      .select("id")
      .eq("id", postId)
      .maybeSingle();

    if (postError || !post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    // Check if user has already flagged this post
    const { data: existingFlag, error: checkError } = await supabase
      .from("confessions_flags")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .eq("user_type", userType)
      .maybeSingle();

    if (existingFlag) {
      return NextResponse.json(
        { error: "You have already flagged this post" },
        { status: 400 }
      );
    }

    // Add flag
    const { error: flagError } = await supabase
      .from("confessions_flags")
      .insert({
        post_id: postId,
        user_id: userId,
        user_type: userType,
      });

    if (flagError) {
      console.error("Error flagging post:", flagError);
      return NextResponse.json(
        { error: "Failed to flag post" },
        { status: 500 }
      );
    }

    // Get updated flag count
    const { count: flagCount } = await supabase
      .from("confessions_flags")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId);

    return NextResponse.json({
      success: true,
      flagCount: flagCount || 0,
    });
  } catch (error) {
    console.error("Error in flag post API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Check if user has flagged this post and get flag count
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { userId: clerkUserId } = await auth();
    const { id: postId } = await params;

    // Get anonymous user ID from query params
    const searchParams = request.nextUrl.searchParams;
    const anonUserId = searchParams.get("anonUserId");

    // Determine user type and ID
    let userId: string | null = null;
    let userType: "clerk" | "anonymous" | null = null;

    if (clerkUserId) {
      userId = clerkUserId;
      userType = "clerk";
    } else if (anonUserId) {
      userId = anonUserId;
      userType = "anonymous";
    }

    // Get flag count
    const { count: flagCount } = await supabase
      .from("confessions_flags")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId);

    // Check if current user has flagged
    let hasFlagged = false;
    if (userId && userType) {
      const { data: flag } = await supabase
        .from("confessions_flags")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", userId)
        .eq("user_type", userType)
        .maybeSingle();

      hasFlagged = !!flag;
    }

    return NextResponse.json({
      flagCount: flagCount || 0,
      hasFlagged,
    });
  } catch (error) {
    console.error("Error in get flag status API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

