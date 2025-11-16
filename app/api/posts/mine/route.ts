import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import { isAdminEmail } from "@/app/lib/admin";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { userId: clerkUserId } = await auth();
    const body = await request.json().catch(() => ({}));
    const anonUserId = body?.anonUserId as string | undefined;

    if (!clerkUserId && !anonUserId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = clerkUserId || anonUserId!;

    // Fetch posts for this user
    const { data: posts, error } = await supabase
      .from("confessions_posts")
      .select(`
        *,
        likes:confessions_likes(count),
        dislikes:confessions_dislikes(count)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching my posts:", error);
      return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
    }

    // Attach counts
    let postsWithCounts = await Promise.all(
      (posts || []).map(async (post) => {
        const { count: likesCount } = await supabase
          .from("confessions_likes")
          .select("*", { count: "exact", head: true })
          .eq("post_id", post.id);

        const { count: dislikesCount } = await supabase
          .from("confessions_dislikes")
          .select("*", { count: "exact", head: true })
          .eq("post_id", post.id);

        const { count: flagsCount } = await supabase
          .from("confessions_flags")
          .select("*", { count: "exact", head: true })
          .eq("post_id", post.id);

        return {
          ...post,
          likes_count: likesCount || 0,
          dislikes_count: dislikesCount || 0,
          flags_count: flagsCount || 0,
        };
      })
    );

    // Attach profile/username for anon users
    if (postsWithCounts.length > 0 && postsWithCounts[0].user_type === "anonymous") {
      const { data: anon } = await supabase
        .from("anon_users")
        .select("id, profile_picture, username")
        .eq("id", userId)
        .maybeSingle();
      postsWithCounts = postsWithCounts.map((p: any) => ({
        ...p,
        profile_picture: p.profile_picture || anon?.profile_picture || null,
        username: anon?.username || p.username,
      }));
    } else if (postsWithCounts.length > 0 && postsWithCounts[0].user_type === "clerk") {
      // For Clerk users, return latest username and image each time
      try {
        const anyClerk: any = await import("@clerk/nextjs/server");
        const client = anyClerk.clerkClient ? anyClerk.clerkClient : null;
        if (client) {
          const u = await client.users.getUser(userId);
          const imageUrl = u?.imageUrl || null;
          const primary = u?.primaryEmailAddress?.emailAddress || u?.emailAddresses?.[0]?.emailAddress || null;
          const name = (u?.username || u?.firstName || (primary?.split("@")[0])) || "User";
          const isAdmin = isAdminEmail(primary);
          postsWithCounts = postsWithCounts.map((p: any) => ({
            ...p,
            profile_picture: imageUrl || p.profile_picture || null,
            username: name || p.username,
            is_admin: isAdmin,
          }));
        }
      } catch {}
    }

    return NextResponse.json({ posts: postsWithCounts });
  } catch (e) {
    console.error("Error in POST /api/posts/mine:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


