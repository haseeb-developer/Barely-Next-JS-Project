import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/app/lib/supabase/service";

const USERNAME_CHANGE_COST = 1000;

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const body = await request.json().catch(() => ({}));
    const { anonUserId, newUsername } = body;

    // Validate input
    if (!anonUserId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (!newUsername || typeof newUsername !== "string") {
      return NextResponse.json({ error: "New username is required" }, { status: 400 });
    }

    // Normalize username to lowercase
    const normalizedNewUsername = newUsername.trim().toLowerCase();

    // Validate username format - must start with "anon-"
    if (!normalizedNewUsername.startsWith("anon-")) {
      return NextResponse.json(
        { error: "Username must start with 'anon-'" },
        { status: 400 }
      );
    }

    // Validate username length (after "anon-" prefix)
    const usernamePart = normalizedNewUsername.substring(5);
    if (usernamePart.length === 0) {
      return NextResponse.json(
        { error: "Username must have characters after 'anon-'" },
        { status: 400 }
      );
    }

    // Get current user data
    const { data: currentUser, error: userError } = await supabase
      .from("anon_users")
      .select("id, username, previous_usernames")
      .eq("id", anonUserId)
      .maybeSingle();

    if (userError || !currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if username is different
    if (currentUser.username.toLowerCase() === normalizedNewUsername) {
      return NextResponse.json(
        { error: "New username must be different from current username" },
        { status: 400 }
      );
    }

    // Check if new username already exists (case-insensitive)
    const { data: existingUser } = await supabase
      .from("anon_users")
      .select("id")
      .ilike("username", normalizedNewUsername)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 400 }
      );
    }

    // Check token balance
    const { data: tokenRecord } = await supabase
      .from("user_tokens")
      .select("balance")
      .eq("user_id", anonUserId)
      .eq("user_type", "anonymous")
      .maybeSingle();

    const currentBalance = tokenRecord?.balance || 0;

    if (currentBalance < USERNAME_CHANGE_COST) {
      const tokensNeeded = USERNAME_CHANGE_COST - currentBalance;
      return NextResponse.json(
        { 
          error: "Insufficient tokens",
          tokensNeeded,
          currentBalance,
          required: USERNAME_CHANGE_COST
        },
        { status: 400 }
      );
    }

    // Deduct tokens
    const newBalance = currentBalance - USERNAME_CHANGE_COST;
    const { error: tokenError } = await supabase
      .from("user_tokens")
      .update({ balance: newBalance })
      .eq("user_id", anonUserId)
      .eq("user_type", "anonymous");

    if (tokenError) {
      return NextResponse.json(
        { error: "Failed to deduct tokens", details: tokenError.message },
        { status: 500 }
      );
    }

    // Build array of previous usernames (append current username to existing array)
    const existingPreviousUsernames = (currentUser.previous_usernames || []) as string[];
    const updatedPreviousUsernames = [...existingPreviousUsernames, currentUser.username];

    // Update username in anon_users table
    const { error: updateError } = await supabase
      .from("anon_users")
      .update({
        username: normalizedNewUsername,
        previous_usernames: updatedPreviousUsernames,
        updated_at: new Date().toISOString(),
      })
      .eq("id", anonUserId);

    if (updateError) {
      // Rollback token deduction if username update fails
      await supabase
        .from("user_tokens")
        .update({ balance: currentBalance })
        .eq("user_id", anonUserId)
        .eq("user_type", "anonymous");

      return NextResponse.json(
        { error: "Failed to update username", details: updateError.message },
        { status: 500 }
      );
    }

    // Update username in all posts
    const { error: postsError } = await supabase
      .from("confessions_posts")
      .update({ username: normalizedNewUsername })
      .eq("user_id", anonUserId)
      .eq("user_type", "anonymous");

    if (postsError) {
      console.error("Error updating posts:", postsError);
      // Don't fail the request, but log the error
    }

    // Update username in all comments
    const { error: commentsError } = await supabase
      .from("confessions_comments")
      .update({ username: normalizedNewUsername })
      .eq("user_id", anonUserId)
      .eq("user_type", "anonymous");

    if (commentsError) {
      console.error("Error updating comments:", commentsError);
      // Don't fail the request, but log the error
    }

    return NextResponse.json({
      success: true,
      newUsername: normalizedNewUsername,
      previousUsername: currentUser.username,
      newBalance,
    });
  } catch (e: any) {
    console.error("Error in change-username:", e);
    return NextResponse.json(
      { error: e?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

