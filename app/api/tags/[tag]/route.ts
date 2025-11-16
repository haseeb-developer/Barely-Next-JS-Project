import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { isAdminEmail } from "@/app/lib/admin";
import { createClient as createSb } from "@supabase/supabase-js";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ tag: string }> }
) {
  try {
    const user = await currentUser();
    const email =
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress ||
      null;
    if (!isAdminEmail(email || undefined)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const raw = (await context.params).tag || "";
    const tag = decodeURIComponent(raw).trim().toLowerCase();
    if (!tag) return NextResponse.json({ error: "Missing tag" }, { status: 400 });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
    if (!url || !key)
      return NextResponse.json({ error: "Server not configured" }, { status: 500 });
    const supabase = createSb(url, key, { auth: { persistSession: false } });

    // Remove the tag from all posts that include it
    // array_remove(tags, tag) will drop every occurrence
    const { error } = await supabase.rpc("exec_sql", {
      // use a secure RPC if available, otherwise do a filtered update
    } as any);

    // Fallback: filtered update (works without custom rpc)
    if (error) {
      const { error: updErr } = await supabase
        .from("confessions_posts")
        .update({})
        .eq("tags", null);
    }

    // Supabase JS doesn't support array_remove directly, so use a PostgREST expression via raw SQL through a stored function alternative:
    // To avoid requiring a migration, use postgrest filter: update with returning computed via request headers is not trivial here.
    // We'll use a single RPC creation-less approach by selecting affected rows then updating each in batches.

    // Read all posts containing the tag
    const { data: posts, error: readErr } = await supabase
      .from("confessions_posts")
      .select("id,tags")
      .contains("tags", [tag]);

    if (readErr) {
      return NextResponse.json({ error: `Read failed: ${readErr.message}` }, { status: 500 });
    }

    let affected = 0;
    for (const p of posts || []) {
      const newTags = (p.tags as string[]).filter((t: string) => t !== tag);
      const { error: uErr } = await supabase
        .from("confessions_posts")
        .update({ tags: newTags })
        .eq("id", p.id);
      if (!uErr) affected++;
    }

    return NextResponse.json({ success: true, affected });
  } catch (e) {
    console.error("delete tag error", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


