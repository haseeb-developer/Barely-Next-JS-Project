import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/app/lib/supabase/service";

const GIF_PROFILE_COST = 1000;

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const searchParams = request.nextUrl.searchParams;
    const anonUserId = searchParams.get("anonUserId");

    if (!anonUserId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    const { data: user, error } = await supabase
      .from("anon_users")
      .select("gif_profile_enabled")
      .eq("id", anonUserId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching GIF profile status:", error);
      return NextResponse.json(
        { error: "Failed to fetch GIF profile status" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      gif_profile_enabled: user?.gif_profile_enabled || false,
    });
  } catch (error) {
    console.error("Error in GET GIF profile API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const body = await request.json().catch(() => ({}));
    const { anonUserId } = body;

    if (!anonUserId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get current user data
    const { data: currentUser, error: userError } = await supabase
      .from("anon_users")
      .select("id, gif_profile_enabled")
      .eq("id", anonUserId)
      .maybeSingle();

    if (userError || !currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if already purchased
    if (currentUser.gif_profile_enabled) {
      return NextResponse.json({
        error: "GIF profile feature is already enabled",
      }, { status: 400 });
    }

    // Check token balance
    const { data: tokenRecord } = await supabase
      .from("user_tokens")
      .select("balance")
      .eq("user_id", anonUserId)
      .eq("user_type", "anonymous")
      .maybeSingle();

    const currentBalance = tokenRecord?.balance || 0;

    if (currentBalance < GIF_PROFILE_COST) {
      const tokensNeeded = GIF_PROFILE_COST - currentBalance;
      return NextResponse.json(
        {
          error: "Insufficient tokens",
          tokensNeeded,
          currentBalance,
          required: GIF_PROFILE_COST,
        },
        { status: 400 }
      );
    }

    // Deduct tokens
    const newBalance = currentBalance - GIF_PROFILE_COST;
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

    // Enable GIF profile feature (permanent)
    const { error: updateError } = await supabase
      .from("anon_users")
      .update({
        gif_profile_enabled: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", anonUserId);

    if (updateError) {
      // Rollback token deduction if update fails
      await supabase
        .from("user_tokens")
        .update({ balance: currentBalance })
        .eq("user_id", anonUserId)
        .eq("user_type", "anonymous");
      
      return NextResponse.json(
        { error: "Failed to enable GIF profile", details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      gif_profile_enabled: true,
      newBalance,
      message: "GIF profile feature enabled successfully",
    });
  } catch (error: any) {
    console.error("Error in POST GIF profile API:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

