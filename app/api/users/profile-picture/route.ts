import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/app/lib/supabase/service";
import { auth } from "@clerk/nextjs/server";

// GET - Get profile picture for anonymous user
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
      .select("profile_picture, previous_usernames, gif_profile_enabled")
      .eq("id", anonUserId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile picture:", error);
      return NextResponse.json(
        { error: "Failed to fetch profile picture" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      profilePicture: user?.profile_picture || null,
      previousUsernames: (user?.previous_usernames || []) as string[],
      gif_profile_enabled: user?.gif_profile_enabled || false,
    });
  } catch (error) {
    console.error("Error in get profile picture API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Update profile picture for anonymous user
export async function POST(request: NextRequest) {
  try {
    // Check if service role key is configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("SUPABASE_SERVICE_ROLE_KEY is not configured");
      return NextResponse.json(
        { error: "Server configuration error: Service role key not found" },
        { status: 500 }
      );
    }

    const supabase = createServiceClient();
    const { userId: clerkUserId } = await auth();
    
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }
    
    const { anonUserId, profilePicture } = body;

    // Only allow anonymous users to update their profile picture
    if (clerkUserId) {
      return NextResponse.json(
        { error: "Clerk users cannot update profile picture here" },
        { status: 403 }
      );
    }

    if (!anonUserId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    // profilePicture can be null to remove the picture

    // Check if user exists first
    const { data: existingUser, error: checkError } = await supabase
      .from("anon_users")
      .select("id")
      .eq("id", anonUserId)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking user:", checkError);
      return NextResponse.json(
        { error: "Failed to verify user" },
        { status: 500 }
      );
    }

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if profile_picture column exists by trying to select it
    const { data: testData, error: columnError } = await supabase
      .from("anon_users")
      .select("profile_picture")
      .eq("id", anonUserId)
      .limit(1);

    if (columnError) {
      console.error("Error checking column existence:", columnError);
      // If column doesn't exist, return helpful error
      if (columnError.message?.includes("column") && columnError.message?.includes("does not exist")) {
        return NextResponse.json(
          { error: "Database column 'profile_picture' does not exist. Please run the SQL migration first." },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: `Database error: ${columnError.message || 'Unknown error'}` },
        { status: 500 }
      );
    }

    // Verify user exists and update profile picture
    console.log("Attempting to update profile picture for user:", anonUserId);
    console.log("Profile picture length:", profilePicture ? profilePicture.length : 0);
    
    const { data: updateData, error: updateError } = await supabase
      .from("anon_users")
      .update({ profile_picture: profilePicture })
      .eq("id", anonUserId)
      .select();

    if (updateError) {
      console.error("Error updating profile picture:", updateError);
      console.error("Update error details:", JSON.stringify(updateError, null, 2));
      return NextResponse.json(
        { error: `Failed to update profile picture: ${updateError.message || 'Unknown error'}` },
        { status: 500 }
      );
    }

    console.log("Profile picture updated successfully:", updateData);

    return NextResponse.json({
      success: true,
      profilePicture,
      message: "Profile picture updated successfully"
    });
  } catch (error: any) {
    console.error("Error in update profile picture API:", error);
    console.error("Error details:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    return NextResponse.json(
      { error: error?.message || "Internal server error. Please check server logs." },
      { status: 500 }
    );
  }
}

