import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { isAdminEmail } from "@/app/lib/admin";
import { createClient as createSb } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || null;
    if (!isAdminEmail(email || undefined)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { subject_type, subject_id, amount } = body || {};
    if (!subject_type || !subject_id || typeof amount !== "number" || !isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
    if (!url || !key) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    const supabase = createSb(url, key, { auth: { persistSession: false } });

    // upsert or increment
    // Try insert first
    const { error: insErr } = await supabase
      .from("user_tokens")
      .insert({ user_id: subject_id, user_type: subject_type, balance: amount });

    if (insErr) {
      // Likely duplicate; increment instead of overwriting
      const { data: existing, error: selErr } = await supabase
        .from("user_tokens")
        .select("balance")
        .eq("user_id", subject_id)
        .eq("user_type", subject_type)
        .maybeSingle();

      if (selErr || !existing) {
        return NextResponse.json({ error: `Read failed: ${selErr?.message || "not found"}` }, { status: 500 });
      }

      const newBalance = (Number(existing.balance) || 0) + amount;
      const { error: updErr } = await supabase
        .from("user_tokens")
        .update({ balance: newBalance })
        .eq("user_id", subject_id)
        .eq("user_type", subject_type);
      if (updErr) return NextResponse.json({ error: `Update failed: ${updErr.message}` }, { status: 500 });
    }

    await supabase.from("moderation_audit_log").insert({
      actor_id: user?.id || null,
      actor_email: email,
      action: "GRANT_TOKENS",
      subject_type,
      subject_id,
      meta: { amount },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("admin/tokens error", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || null;
    if (!isAdminEmail(email || undefined)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const url = new URL(req.url);
    const subject_type = url.searchParams.get("subject_type") || "";
    const subject_id = url.searchParams.get("subject_id") || "";
    if (!subject_type || !subject_id) return NextResponse.json({ error: "Missing params" }, { status: 400 });

    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
    const supabase = createSb(sbUrl, key, { auth: { persistSession: false } });

    const { data, error } = await supabase
      .from("user_tokens")
      .select("balance")
      .eq("user_id", subject_id)
      .eq("user_type", subject_type)
      .maybeSingle();
    if (error) return NextResponse.json({ error: "Read failed" }, { status: 500 });
    return NextResponse.json({ balance: Number(data?.balance || 0) });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || null;
    if (!isAdminEmail(email || undefined)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { subject_type, subject_id } = body || {};
    if (!subject_type || !subject_id) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
    const supabase = createSb(url, key, { auth: { persistSession: false } });

    // Set balance to 0 (create row if not exists)
    const { error } = await supabase
      .from("user_tokens")
      .upsert({ user_id: subject_id, user_type: subject_type, balance: 0 }, { onConflict: "user_id,user_type" });
    if (error) return NextResponse.json({ error: `Reset failed: ${error.message}` }, { status: 500 });

    await supabase.from("moderation_audit_log").insert({
      actor_id: user?.id || null,
      actor_email: email,
      action: "RESET_TOKENS",
      subject_type,
      subject_id,
      meta: { balance: 0 },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

