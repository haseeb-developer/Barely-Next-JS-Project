import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { isAdminEmail } from "@/app/lib/admin";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { userId } = await auth();
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || null;
    if (!isAdminEmail(email || undefined)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { subject_type, subject_id, action, reason, expires_at } = body || {};
    if (!subject_type || !subject_id || !action) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const { error } = await supabase.from("user_suspensions").insert({
      subject_type,
      subject_id,
      action,
      reason: reason || null,
      created_by: email || userId || "admin",
      expires_at: expires_at || null,
      active: true,
    });
    if (error) return NextResponse.json({ error: "Failed to create suspension" }, { status: 500 });

    await supabase.from("moderation_audit_log").insert({
      actor_id: userId || null,
      actor_email: email,
      action: action.toUpperCase(),
      subject_type,
      subject_id,
      meta: { reason, expires_at },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("admin/suspensions POST error", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { userId } = await auth();
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || null;
    if (!isAdminEmail(email || undefined)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { suspension_id, subject_type, subject_id } = body || {};
    if (!suspension_id && !(subject_type && subject_id)) {
      return NextResponse.json({ error: "Provide suspension_id or subject_type+subject_id" }, { status: 400 });
    }

    let q = supabase.from("user_suspensions").update({ active: false });
    if (suspension_id) {
      q = q.eq("id", suspension_id as string);
    } else {
      q = q.eq("subject_type", subject_type as string).eq("subject_id", subject_id as string).eq("active", true);
    }
    const { error } = await q;
    if (error) return NextResponse.json({ error: "Failed to deactivate suspension" }, { status: 500 });

    await supabase.from("moderation_audit_log").insert({
      actor_id: userId || null,
      actor_email: email,
      action: "UNSUSPEND",
      subject_type: (subject_type as string) || null,
      subject_id: (subject_id as string) || suspension_id || null,
      meta: { suspension_id },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("admin/suspensions DELETE error", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


