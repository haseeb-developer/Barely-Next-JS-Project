import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/app/lib/supabase/service";

export async function POST(request: NextRequest) {
  try {
    const { ipAddress, reason } = await request.json();

    if (!ipAddress || !reason) {
      return NextResponse.json(
        { error: "IP address and reason are required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Check if IP is already banned
    const { data: existing } = await supabase
      .from("banned_ips")
      .select("id")
      .eq("ip_address", ipAddress)
      .single();

    if (existing) {
      return NextResponse.json({ success: true, message: "IP already banned" });
    }

    // Ban the IP
    const { error } = await supabase
      .from("banned_ips")
      .insert({
        ip_address: ipAddress,
        reason: reason,
        banned_by: "system",
        is_permanent: true,
      });

    if (error) {
      return NextResponse.json(
        { error: "Failed to ban IP address" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "IP banned successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

