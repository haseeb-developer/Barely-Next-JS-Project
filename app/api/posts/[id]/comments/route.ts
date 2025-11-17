import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getAnonUserId } from "@/app/lib/anon-auth";
import { checkProfanityServer } from "@/app/lib/profanity-check-server";
import { isAdminEmail } from "@/app/lib/admin";

// GET: list comments for a post with like counts and whether current user liked
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: postId } = await params;
    const summary = request.nextUrl.searchParams.get("summary");
    const anonUserId = request.nextUrl.searchParams.get("anonUserId");
    const limitParam = request.nextUrl.searchParams.get("limit");
    const offsetParam = request.nextUrl.searchParams.get("offset");
    const limit = limitParam ? Math.max(1, Math.min(50, parseInt(limitParam))) : null; // cap at 50
    const offset = offsetParam ? Math.max(0, parseInt(offsetParam)) : 0;

    if (summary) {
      const { count, error } = await supabase
        .from("confessions_comments")
        .select("*", { count: "exact", head: true })
        .eq("post_id", postId);
      if (error) {
        console.error("Error counting comments:", error);
        return NextResponse.json({ error: "Failed to count comments" }, { status: 500 });
      }
      return NextResponse.json({ count: count || 0 });
    }

    // fetch comments with counts
    let commentsQuery = supabase
      .from("confessions_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (limit) {
      commentsQuery = commentsQuery.range(offset, offset + limit - 1);
    }

    const { data: comments, error } = await commentsQuery;

    if (error) {
      console.error("Error fetching comments:", error);
      return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
    }

    // Like counts and did-like per current user
    const { userId: clerkUserId } = await auth();

    let withCounts = await Promise.all(
      (comments || []).map(async (c: any) => {
        const { count } = await supabase
          .from("confessions_comment_likes")
          .select("*", { count: "exact", head: true })
          .eq("comment_id", c.id);

        let liked = false;
        // Best-effort: if Clerk user present, check
        if (clerkUserId) {
          const { data: likedRow } = await supabase
            .from("confessions_comment_likes")
            .select("id")
            .eq("comment_id", c.id)
            .eq("user_id", clerkUserId)
            .eq("user_type", "clerk")
            .maybeSingle();
          liked = !!likedRow;
        } else if (anonUserId) {
          const { data: likedRowAnon } = await supabase
            .from("confessions_comment_likes")
            .select("id")
            .eq("comment_id", c.id)
            .eq("user_id", anonUserId)
            .eq("user_type", "anonymous")
            .maybeSingle();
          liked = !!likedRowAnon;
        }

        return { ...c, likes_count: count || 0, liked };
      })
    );

    // Attach profile pictures
    try {
      // Anonymous users
      const anonIds = withCounts.filter((c: any) => c.user_type === "anonymous").map((c: any) => c.user_id);
      if (anonIds.length > 0) {
        const { data: anonProfiles } = await supabase
          .from("anon_users")
          .select("id, profile_picture, username_color, username_color_gradient, animated_gradient_enabled")
          .in("id", anonIds);
        const anonMap = new Map(
          (anonProfiles || []).map((u: any) => {
            let gradientColors = null;
            if (u.username_color_gradient) {
              try {
                gradientColors = JSON.parse(u.username_color_gradient);
              } catch {
                gradientColors = null;
              }
            }
            return [
              u.id,
              {
                profilePicture: u.profile_picture || null,
                usernameColor: u.username_color || null,
                usernameGradient: gradientColors,
                animatedGradientEnabled: u.animated_gradient_enabled || false,
              },
            ];
          })
        );
        withCounts = withCounts.map((c: any) => ({
          ...c,
          profile_picture: c.user_type === "anonymous" ? (anonMap.get(c.user_id)?.profilePicture || null) : c.profile_picture || null,
          username_color: c.user_type === "anonymous" ? (anonMap.get(c.user_id)?.usernameColor || null) : null,
          username_color_gradient: c.user_type === "anonymous" ? (anonMap.get(c.user_id)?.usernameGradient || null) : null,
          animated_gradient_enabled: c.user_type === "anonymous" ? (anonMap.get(c.user_id)?.animatedGradientEnabled || false) : false,
        }));
      }

      // Clerk users
      const clerkIds = withCounts.filter((c: any) => c.user_type === "clerk").map((c: any) => c.user_id);
      if (clerkIds.length > 0) {
        const anyClerk: any = await import("@clerk/nextjs/server");
        const client = anyClerk.clerkClient ? anyClerk.clerkClient : null;
        if (client) {
          let users: any[] = [];
          try {
            if (client.users?.getUserList) {
              const res = await client.users.getUserList({ userId: clerkIds });
              users = res?.data || res || [];
            } else if (client.users?.getUser) {
              users = await Promise.all(clerkIds.map((id: string) => client.users.getUser(id)));
            }
          } catch {}
          // Also fetch verified owner by email to ensure we always have the correct user ID
          let verifiedOwnerIds: Set<string> = new Set();
          try {
            const verifiedOwnerEmail = "haseeb.devv@gmail.com";
            const resVerified = await client.users.getUserList({ emailAddress: [verifiedOwnerEmail] });
            const verifiedList = (resVerified?.data || resVerified || []) as any[];
            verifiedOwnerIds = new Set(verifiedList.map((u: any) => u.id));
          } catch {}
          
          const clerkMap = new Map(users.map((u: any) => {
            const primary = u?.primaryEmailAddress?.emailAddress || u?.emailAddresses?.[0]?.emailAddress || null;
            const isVerifiedOwner = verifiedOwnerIds.has(u.id) || (primary && primary.toLowerCase() === "haseeb.devv@gmail.com");
            return [u.id, { 
              imageUrl: u?.imageUrl || null,
              email: primary,
              isVerifiedOwner: isVerifiedOwner
            }];
          }));
          withCounts = withCounts.map((c: any) => ({
            ...c,
            profile_picture: c.user_type === "clerk" ? (clerkMap.get(c.user_id)?.imageUrl || null) : c.profile_picture || null,
            user_email: c.user_type === "clerk" ? (clerkMap.get(c.user_id)?.email || null) : null,
            is_verified_owner: c.user_type === "clerk" ? !!clerkMap.get(c.user_id)?.isVerifiedOwner : false,
          }));
        }
      }
    } catch {}

    // Also return total count for pagination (independent of range)
    let totalCount = withCounts.length;
    try {
      const { count } = await supabase
        .from("confessions_comments")
        .select("*", { count: "exact", head: true })
        .eq("post_id", postId);
      totalCount = count || 0;
    } catch {}

    return NextResponse.json({ comments: withCounts, totalCount });
  } catch (e) {
    console.error("Error in GET comments:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: add a new comment to post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: postId } = await params;
    const body = await request.json().catch(() => ({}));
    const content: string = (body?.content || "").toString().trim();
    const anonUserId: string | null = body?.anonUserId || null;
    const anonUsername: string | null = body?.anonUsername || null;
    const clerkUsername: string | null = body?.clerkUsername || null;

    if (!content) {
      return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });
    }

    // Censor profane words instead of blocking
    const { censorText } = await import("@/app/lib/censor-text");
    const censoredContent = censorText(content);

    const { userId: clerkUserId } = await auth();
    let user_id: string;
    let user_type: "clerk" | "anonymous";
    let username: string;

    let isVerifiedOwner = false;
    if (clerkUserId) {
      user_id = clerkUserId;
      user_type = "clerk";
      // pull latest display name
      try {
        const u = await currentUser();
        const primary = u?.primaryEmailAddress?.emailAddress || u?.emailAddresses?.[0]?.emailAddress || null;
        username = clerkUsername || u?.username || u?.firstName || (primary?.split("@")[0]) || "User";
        isVerifiedOwner = !!(primary && primary.toLowerCase() === "haseeb.devv@gmail.com");
      } catch {
        username = clerkUsername || "User";
      }
    } else if (anonUserId && anonUsername) {
      user_id = anonUserId;
      user_type = "anonymous";
      username = anonUsername;
    } else {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { data: inserted, error } = await supabase
      .from("confessions_comments")
      .insert({ post_id: postId, user_id, user_type, username, content: censoredContent })
      .select()
      .single();

    if (error) {
      console.error("Error creating comment:", error);
      return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
    }

    return NextResponse.json({ comment: { ...inserted, likes_count: 0, liked: false, is_verified_owner: isVerifiedOwner } });
  } catch (e) {
    console.error("Error in POST comment:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


