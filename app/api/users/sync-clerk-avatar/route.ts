import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createServiceClient } from "@/app/lib/supabase/service";
import { isAdminEmail } from "@/app/lib/admin";

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await currentUser();
    const imageUrl = user?.imageUrl || null;
    const displayName =
      user?.username ||
      user?.firstName ||
      user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
      "User";

    const supabase = createServiceClient();

    const email = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || null;
    const isAdmin = isAdminEmail(email || undefined);
    const { error } = await supabase
      .from("confessions_posts")
      .update({ profile_picture: imageUrl, username: displayName, is_admin: isAdmin })
      .eq("user_id", userId)
      .eq("user_type", "clerk");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, imageUrl, displayName, is_admin: isAdmin });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}


