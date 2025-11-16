import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServiceClient } from "@/app/lib/supabase/service";

const DAILY_TOKENS = 50;
const DAY_MS = 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const { userId: clerkUserId } = await auth();
    const searchParams = request.nextUrl.searchParams;
    const anonUserId = searchParams.get("anonUserId");

    if (!clerkUserId && !anonUserId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userId = clerkUserId || anonUserId!;
    const userType = clerkUserId ? "clerk" : "anonymous";

    const { data: rec } = await supabase
      .from("user_tokens")
      .select("*")
      .eq("user_id", userId)
      .eq("user_type", userType)
      .maybeSingle();

    return NextResponse.json({ balance: rec?.balance || 0, last_awarded_at: rec?.last_awarded_at || null });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const { userId: clerkUserId } = await auth();
    const body = await request.json().catch(() => ({}));
    const anonUserId = body?.anonUserId as string | undefined;

    if (!clerkUserId && !anonUserId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userId = clerkUserId || anonUserId!;
    const userType = clerkUserId ? "clerk" : "anonymous";

    // Fetch token record
    const { data: rec } = await supabase
      .from("user_tokens")
      .select("*")
      .eq("user_id", userId)
      .eq("user_type", userType)
      .maybeSingle();

    const now = new Date();
    let awarded = false;

    if (!rec) {
      // First time: create record and award
      const { error } = await supabase.from("user_tokens").insert({
        user_id: userId,
        user_type: userType,
        balance: DAILY_TOKENS,
        last_awarded_at: now.toISOString(),
      });
      if (error) throw error;
      awarded = true;
    } else {
      const last = rec.last_awarded_at ? new Date(rec.last_awarded_at) : null;
      const diff = last ? now.getTime() - last.getTime() : DAY_MS + 1;
      if (diff >= DAY_MS) {
        const { error } = await supabase
          .from("user_tokens")
          .update({
            balance: rec.balance + DAILY_TOKENS,
            last_awarded_at: now.toISOString(),
          })
          .eq("user_id", userId)
          .eq("user_type", userType);
        if (error) throw error;
        awarded = true;
      }
    }

    // Return current balance
    const { data: after } = await supabase
      .from("user_tokens")
      .select("*")
      .eq("user_id", userId)
      .eq("user_type", userType)
      .maybeSingle();

    return NextResponse.json({ balance: after?.balance || 0, awarded });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Internal server error" }, { status: 500 });
  }
}


