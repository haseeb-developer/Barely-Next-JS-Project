import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/app/lib/supabase/service";

const SOLID_COLOR_COST = 250;
const GRADIENT_COLOR_COST = 500;
const ADDITIONAL_GRADIENT_COLOR_COST = 25; // Cost for 4th, 5th, etc. colors
const ANIMATED_GRADIENT_COST = 500; // One-time purchase for animated gradient

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const body = await request.json().catch(() => ({}));
    const { anonUserId, colorType, color, gradientColors, currentGradientCount } = body;

    // Validate input
    if (!anonUserId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (!colorType || !["solid", "gradient", "remove", "purchase-animated-gradient"].includes(colorType)) {
      return NextResponse.json(
        { error: "Invalid color type. Must be 'solid', 'gradient', 'remove', or 'purchase-animated-gradient'" },
        { status: 400 }
      );
    }

    // Get current user data
    const { data: currentUser, error: userError } = await supabase
      .from("anon_users")
      .select("id")
      .eq("id", anonUserId)
      .maybeSingle();

    if (userError || !currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Handle removal (free)
    if (colorType === "remove") {
      const { error: updateError } = await supabase
        .from("anon_users")
        .update({
          username_color: null,
          username_color_gradient: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", anonUserId);

      if (updateError) {
        return NextResponse.json(
          { error: "Failed to remove username color", details: updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, message: "Username color removed" });
    }

    // Validate and process solid color
    if (colorType === "solid") {
      if (!color || typeof color !== "string") {
        return NextResponse.json(
          { error: "Color is required for solid color type" },
          { status: 400 }
        );
      }

      // Validate hex color format
      const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (!hexPattern.test(color)) {
        return NextResponse.json(
          { error: "Invalid color format. Must be a valid hex color (e.g., #FF5733)" },
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

      if (currentBalance < SOLID_COLOR_COST) {
        const tokensNeeded = SOLID_COLOR_COST - currentBalance;
        return NextResponse.json(
          {
            error: "Insufficient tokens",
            tokensNeeded,
            currentBalance,
            required: SOLID_COLOR_COST,
          },
          { status: 400 }
        );
      }

      // Deduct tokens
      const newBalance = currentBalance - SOLID_COLOR_COST;
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

      // Get current purchased colors
      const { data: userData } = await supabase
        .from("anon_users")
        .select("purchased_solid_colors")
        .eq("id", anonUserId)
        .maybeSingle();

      let purchasedSolidColors: string[] = [];
      try {
        purchasedSolidColors = userData?.purchased_solid_colors 
          ? JSON.parse(userData.purchased_solid_colors) 
          : [];
      } catch {
        purchasedSolidColors = [];
      }

      // Add color to purchased list if not already there
      if (!purchasedSolidColors.includes(color)) {
        purchasedSolidColors.push(color);
      }

      // Update username color and purchased colors
      const { error: updateError } = await supabase
        .from("anon_users")
        .update({
          username_color: color,
          username_color_gradient: null, // Clear gradient when setting solid color
          purchased_solid_colors: JSON.stringify(purchasedSolidColors),
          updated_at: new Date().toISOString(),
        })
        .eq("id", anonUserId);

      if (updateError) {
        // Rollback token deduction
        await supabase
          .from("user_tokens")
          .update({ balance: currentBalance })
          .eq("user_id", anonUserId)
          .eq("user_type", "anonymous");

        return NextResponse.json(
          { error: "Failed to update username color", details: updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        colorType: "solid",
        color,
        newBalance,
      });
    }

    // Validate and process gradient
    if (colorType === "gradient") {
      if (!gradientColors || !Array.isArray(gradientColors) || gradientColors.length < 2) {
        return NextResponse.json(
          { error: "Gradient must have at least 2 colors" },
          { status: 400 }
        );
      }

      // Get current user data including purchased slots
      const { data: userData } = await supabase
        .from("anon_users")
        .select("purchased_gradient_color_slots")
        .eq("id", anonUserId)
        .maybeSingle();

      const currentPurchasedSlots = userData?.purchased_gradient_color_slots || 0;

      // Calculate cost: 500 for base gradient, 25 for each NEW slot beyond 3
      const baseCost = GRADIENT_COLOR_COST;
      const requiredSlots = Math.max(0, gradientColors.length - 3);
      const newSlotsNeeded = Math.max(0, requiredSlots - currentPurchasedSlots);
      const additionalCost = newSlotsNeeded * ADDITIONAL_GRADIENT_COLOR_COST;
      const totalCost = baseCost + additionalCost;

      // Validate each color in gradient
      const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      for (const gradColor of gradientColors) {
        if (!gradColor || typeof gradColor !== "string" || !hexPattern.test(gradColor)) {
          return NextResponse.json(
            { error: `Invalid gradient color: ${gradColor}. Must be a valid hex color` },
            { status: 400 }
          );
        }
      }

      // Check token balance
      const { data: tokenRecord } = await supabase
        .from("user_tokens")
        .select("balance")
        .eq("user_id", anonUserId)
        .eq("user_type", "anonymous")
        .maybeSingle();

      const currentBalance = tokenRecord?.balance || 0;

      if (currentBalance < totalCost) {
        const tokensNeeded = totalCost - currentBalance;
        return NextResponse.json(
          {
            error: "Insufficient tokens",
            tokensNeeded,
            currentBalance,
            required: totalCost,
          },
          { status: 400 }
        );
      }

      // Deduct tokens
      const newBalance = currentBalance - totalCost;
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

      // Store gradient as JSON string
      const gradientJson = JSON.stringify(gradientColors);

      // Get current purchased gradient colors (already fetched above, but need to fetch again for colors)
      const { data: userDataForColors } = await supabase
        .from("anon_users")
        .select("purchased_gradient_colors")
        .eq("id", anonUserId)
        .maybeSingle();

      let purchasedGradientColors: string[][] = [];
      try {
        purchasedGradientColors = userDataForColors?.purchased_gradient_colors 
          ? JSON.parse(userDataForColors.purchased_gradient_colors) 
          : [];
      } catch {
        purchasedGradientColors = [];
      }

      // Add gradient to purchased list if not already there (check by comparing arrays)
      const gradientExists = purchasedGradientColors.some(
        (purchased: string[]) => 
          purchased.length === gradientColors.length &&
          purchased.every((color, idx) => color === gradientColors[idx])
      );

      if (!gradientExists) {
        purchasedGradientColors.push(gradientColors);
      }

      // Update username color gradient, purchased colors, and slots
      const newPurchasedSlots = Math.max(currentPurchasedSlots, requiredSlots);
      const { error: updateError } = await supabase
        .from("anon_users")
        .update({
          username_color: null, // Clear solid color when setting gradient
          username_color_gradient: gradientJson,
          purchased_gradient_colors: JSON.stringify(purchasedGradientColors),
          purchased_gradient_color_slots: newPurchasedSlots,
          updated_at: new Date().toISOString(),
        })
        .eq("id", anonUserId);

      if (updateError) {
        // Rollback token deduction
        await supabase
          .from("user_tokens")
          .update({ balance: currentBalance })
          .eq("user_id", anonUserId)
          .eq("user_type", "anonymous");

        return NextResponse.json(
          { error: "Failed to update username gradient", details: updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        colorType: "gradient",
        gradientColors,
        newBalance,
      });
    }

    // Handle animated gradient purchase (one-time, permanent)
    if (colorType === "purchase-animated-gradient") {
      // Check if already purchased
      const { data: userData } = await supabase
        .from("anon_users")
        .select("animated_gradient_enabled")
        .eq("id", anonUserId)
        .maybeSingle();

      if (userData?.animated_gradient_enabled) {
        return NextResponse.json({
          error: "Animated gradient is already enabled",
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

      if (currentBalance < ANIMATED_GRADIENT_COST) {
        const tokensNeeded = ANIMATED_GRADIENT_COST - currentBalance;
        return NextResponse.json(
          {
            error: "Insufficient tokens",
            tokensNeeded,
            currentBalance,
            required: ANIMATED_GRADIENT_COST,
          },
          { status: 400 }
        );
      }

      // Deduct tokens
      const newBalance = currentBalance - ANIMATED_GRADIENT_COST;
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

      // Enable animated gradient (permanent, can't be removed)
      const { error: updateError } = await supabase
        .from("anon_users")
        .update({
          animated_gradient_enabled: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", anonUserId);

      if (updateError) {
        // Rollback token deduction
        await supabase
          .from("user_tokens")
          .update({ balance: currentBalance })
          .eq("user_id", anonUserId)
          .eq("user_type", "anonymous");

        return NextResponse.json(
          { error: "Failed to enable animated gradient", details: updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        animatedGradientEnabled: true,
        newBalance,
      });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (e: any) {
    console.error("Error in username-color:", e);
    return NextResponse.json(
      { error: e?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Fetch current username color
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const searchParams = request.nextUrl.searchParams;
    const anonUserId = searchParams.get("anonUserId");

    if (!anonUserId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const { data: user, error } = await supabase
      .from("anon_users")
      .select("username_color, username_color_gradient, purchased_solid_colors, purchased_gradient_colors, purchased_gradient_color_slots, animated_gradient_enabled")
      .eq("id", anonUserId)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch username color" },
        { status: 500 }
      );
    }

    let gradientColors = null;
    if (user?.username_color_gradient) {
      try {
        gradientColors = JSON.parse(user.username_color_gradient);
      } catch {
        gradientColors = null;
      }
    }

    let purchasedSolidColors: string[] = [];
    try {
      purchasedSolidColors = user?.purchased_solid_colors 
        ? JSON.parse(user.purchased_solid_colors) 
        : [];
    } catch {
      purchasedSolidColors = [];
    }

    let purchasedGradientColors: string[][] = [];
    try {
      purchasedGradientColors = user?.purchased_gradient_colors 
        ? JSON.parse(user.purchased_gradient_colors) 
        : [];
    } catch {
      purchasedGradientColors = [];
    }

    return NextResponse.json({
      username_color: user?.username_color || null,
      username_color_gradient: gradientColors,
      purchased_solid_colors: purchasedSolidColors,
      purchased_gradient_colors: purchasedGradientColors,
      purchased_gradient_color_slots: user?.purchased_gradient_color_slots || 0,
      animated_gradient_enabled: user?.animated_gradient_enabled || false,
    });
  } catch (e: any) {
    console.error("Error in GET username-color:", e);
    return NextResponse.json(
      { error: e?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

