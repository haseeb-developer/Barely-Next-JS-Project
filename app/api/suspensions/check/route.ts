import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json().catch(() => ({}));
    const anonUserId: string | null = body?.anonUserId || null;

    const { userId: clerkUserId } = await auth();

    // derive ip if needed
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "";

    const now = new Date().toISOString();

    // check bans/terminations for clerk
    if (clerkUserId) {
      const { data } = await supabase
        .from("user_suspensions")
        .select("*")
        .eq("subject_type", "clerk")
        .eq("subject_id", clerkUserId)
        .eq("active", true);

      const active = (data || []).find(
        (s: any) => !s.expires_at || s.expires_at > now
      );
      if (active) {
        return NextResponse.json({
          banned: active.action === "ban",
          terminatedUntil: active.action === "terminate" ? active.expires_at : null,
        });
      }
    }

    // check anon id
    if (anonUserId) {
      const { data } = await supabase
        .from("user_suspensions")
        .select("*")
        .eq("subject_type", "anonymous")
        .eq("subject_id", anonUserId)
        .eq("active", true);

      const active = (data || []).find(
        (s: any) => !s.expires_at || s.expires_at > now
      );
      if (active) {
        return NextResponse.json({
          banned: active.action === "ban",
          terminatedUntil: active.action === "terminate" ? active.expires_at : null,
        });
      }
    }

    // optional: check banned IP
    if (ip) {
      const { data: ipBan } = await supabase
        .from("banned_ips")
        .select("ip_address")
        .eq("ip_address", ip)
        .maybeSingle();
      if (ipBan) {
        return NextResponse.json({ banned: true, terminatedUntil: null });
      }
    }

    return NextResponse.json({ banned: false, terminatedUntil: null });
  } catch (e) {
    console.error("suspensions/check error", e);
    return NextResponse.json({ banned: false, terminatedUntil: null });
  }
}


