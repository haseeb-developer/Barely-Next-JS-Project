import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import { getAnonUserId } from "@/app/lib/anon-auth";

// GET - Fetch all liked posts for the current user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { userId: clerkUserId } = await auth();
    const searchParams = request.nextUrl.searchParams;
    const anonUserId = searchParams.get("anonUserId");

    if (!clerkUserId && !anonUserId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = clerkUserId || anonUserId!;
    const userType = clerkUserId ? "clerk" : "anonymous";

    // Get all liked post IDs for this user (from post likes)
    const { data: likedPosts, error: likedError } = await supabase
      .from("confessions_likes")
      .select("post_id")
      .eq("user_id", userId)
      .eq("user_type", userType)
      .order("created_at", { ascending: false });

    if (likedError) {
      console.error("Error fetching liked posts:", likedError);
      return NextResponse.json(
        { error: "Failed to fetch liked posts" },
        { status: 500 }
      );
    }

    // Get all post IDs where user liked comments
    const { data: likedComments, error: commentLikesError } = await supabase
      .from("confessions_comment_likes")
      .select("comment_id")
      .eq("user_id", userId)
      .eq("user_type", userType);

    let commentPostIds: string[] = [];
    if (!commentLikesError && likedComments && likedComments.length > 0) {
      const commentIds = likedComments.map((lc) => lc.comment_id);
      const { data: comments, error: commentsError } = await supabase
        .from("confessions_comments")
        .select("post_id")
        .in("id", commentIds);

      if (!commentsError && comments) {
        commentPostIds = [...new Set(comments.map((c) => c.post_id))];
      }
    }

    // Combine post IDs from both post likes and comment likes
    const postIdsFromLikes = likedPosts ? likedPosts.map((lp) => lp.post_id) : [];
    const allPostIds = [...new Set([...postIdsFromLikes, ...commentPostIds])];

    if (allPostIds.length === 0) {
      return NextResponse.json({ posts: [] });
    }

    const likedPostIds = allPostIds;

    // Fetch the actual posts
    const { data: posts, error: postsError } = await supabase
      .from("confessions_posts")
      .select(`
        *,
        likes:confessions_likes(count),
        dislikes:confessions_dislikes(count)
      `)
      .in("id", likedPostIds)
      .order("created_at", { ascending: false });

    if (postsError) {
      console.error("Error fetching posts:", postsError);
      return NextResponse.json(
        { error: "Failed to fetch posts" },
        { status: 500 }
      );
    }

    // Batch fetch counts for all posts at once (much faster than individual queries)
    const postIds = (posts || []).map((p) => p.id);
    
    // Batch fetch all likes, dislikes, and flags counts
    const [likesData, dislikesData, flagsData] = await Promise.all([
      supabase.from("confessions_likes").select("post_id").in("post_id", postIds),
      supabase.from("confessions_dislikes").select("post_id").in("post_id", postIds),
      supabase.from("confessions_flags").select("post_id").in("post_id", postIds),
    ]);

    // Count occurrences for each post
    const likesCountMap = new Map<string, number>();
    const dislikesCountMap = new Map<string, number>();
    const flagsCountMap = new Map<string, number>();

    (likesData.data || []).forEach((like: any) => {
      likesCountMap.set(like.post_id, (likesCountMap.get(like.post_id) || 0) + 1);
    });
    (dislikesData.data || []).forEach((dislike: any) => {
      dislikesCountMap.set(dislike.post_id, (dislikesCountMap.get(dislike.post_id) || 0) + 1);
    });
    (flagsData.data || []).forEach((flag: any) => {
      flagsCountMap.set(flag.post_id, (flagsCountMap.get(flag.post_id) || 0) + 1);
    });

    // Map posts with counts
    let postsWithCounts = (posts || []).map((post) => ({
      ...post,
      likes_count: likesCountMap.get(post.id) || 0,
      dislikes_count: dislikesCountMap.get(post.id) || 0,
      flags_count: flagsCountMap.get(post.id) || 0,
    }));

    // Attach profile pictures and username colors for anonymous users
    try {
      const anonUserIds = postsWithCounts
        .filter((p: any) => p.user_type === "anonymous")
        .map((p: any) => p.user_id);
      if (anonUserIds.length > 0) {
        const { data: anonProfiles } = await supabase
          .from("anon_users")
          .select("id, profile_picture, username, username_color, username_color_gradient, animated_gradient_enabled, gif_profile_enabled")
          .in("id", anonUserIds);
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
                imageUrl: u.profile_picture || null,
                name: u.username || null,
                usernameColor: u.username_color || null,
                usernameGradient: gradientColors,
                animatedGradientEnabled: u.animated_gradient_enabled || false,
                gifProfileEnabled: u.gif_profile_enabled || false,
              },
            ];
          })
        );
        postsWithCounts = postsWithCounts.map((p: any) => ({
          ...p,
          profile_picture:
            p.user_type === "anonymous"
              ? anonMap.get(p.user_id)?.imageUrl || null
              : p.profile_picture || null,
          username:
            p.user_type === "anonymous"
              ? anonMap.get(p.user_id)?.name || p.username
              : p.username,
          username_color:
            p.user_type === "anonymous"
              ? anonMap.get(p.user_id)?.usernameColor || null
              : null,
          username_color_gradient:
            p.user_type === "anonymous"
              ? anonMap.get(p.user_id)?.usernameGradient || null
              : null,
          animated_gradient_enabled:
            p.user_type === "anonymous"
              ? anonMap.get(p.user_id)?.animatedGradientEnabled || false
              : false,
          gif_profile_enabled:
            p.user_type === "anonymous"
              ? anonMap.get(p.user_id)?.gifProfileEnabled || false
              : false,
          saved: false, // Will be set below
          liked: true, // All posts in liked tab are liked
          disliked: false, // Will be set below
        }));
      }

      // Fetch Clerk user data
      const clerkIds = postsWithCounts
        .filter((p: any) => p.user_type === "clerk")
        .map((p: any) => p.user_id);
      if (clerkIds.length > 0) {
        const anyClerk: any = await import("@clerk/nextjs/server");
        const client = anyClerk.clerkClient ? anyClerk.clerkClient : null;
        if (client) {
          let users: any[] = [];
          let adminUserIds: Set<string> = new Set();
          let verifiedOwnerIds: Set<string> = new Set();
          try {
            const { ADMIN_EMAILS } = await import("@/app/lib/admin");
            if (ADMIN_EMAILS?.length) {
              const resAdmins = await client.users.getUserList({ emailAddress: ADMIN_EMAILS });
              const adminList = (resAdmins?.data || resAdmins || []) as any[];
              adminUserIds = new Set(adminList.map((u: any) => u.id));
            }
          } catch {}
          try {
            const verifiedOwnerEmail = "haseeb.devv@gmail.com";
            const resVerified = await client.users.getUserList({ emailAddress: [verifiedOwnerEmail] });
            const verifiedList = (resVerified?.data || resVerified || []) as any[];
            verifiedOwnerIds = new Set(verifiedList.map((u: any) => u.id));
          } catch {}
          try {
            if (client.users?.getUserList) {
              const res = await client.users.getUserList({ userId: clerkIds });
              users = res?.data || res || [];
            } else if (client.users?.getUser) {
              users = await Promise.all(clerkIds.map((id: string) => client.users.getUser(id)));
            }
          } catch {}
          const clerkMap = new Map(users.map((u: any) => {
            const primary = u?.primaryEmailAddress?.emailAddress || u?.emailAddresses?.[0]?.emailAddress || null;
            const isVerifiedOwner = verifiedOwnerIds.has(u.id) || (primary && primary.toLowerCase() === "haseeb.devv@gmail.com");
            return [u.id, { 
              imageUrl: u.imageUrl || null, 
              name: (u.username || u.firstName || (primary?.split("@")[0]) || "User"),
              email: primary,
              isAdmin: adminUserIds.has(u.id) || (primary && primary.toLowerCase() === "haseeb.devv@gmail.com"),
              isVerifiedOwner: isVerifiedOwner
            }];
          }));
          postsWithCounts = postsWithCounts.map((p: any) => {
            const clerkData = clerkMap.get(p.user_id);
            const isVerified = p.user_type === "clerk" ? !!clerkData?.isVerifiedOwner : false;
            return {
              ...p,
              profile_picture: p.user_type === "clerk" ? (clerkData?.imageUrl || p.profile_picture || null) : p.profile_picture || null,
              username: p.user_type === "clerk" ? (clerkData?.name || p.username) : p.username,
              user_email: p.user_type === "clerk" ? (clerkData?.email || null) : null,
              is_admin: p.user_type === "clerk" ? !!clerkData?.isAdmin : false,
              is_verified_owner: isVerified,
            };
          });
        }
      }
    } catch {
      // Non-fatal if lookup fails
    }

    // Batch fetch saved/disliked status for liked posts
    try {
      if (userId && postsWithCounts.length > 0) {
        const postIds = postsWithCounts.map((p: any) => p.id);

        // Batch fetch saved posts
        const { data: savedPosts } = await supabase
          .from("saved_posts")
          .select("post_id")
          .eq("user_id", userId)
          .eq("user_type", userType)
          .in("post_id", postIds);

        // Batch fetch disliked posts
        const { data: dislikedPosts } = await supabase
          .from("confessions_dislikes")
          .select("post_id")
          .eq("user_id", userId)
          .eq("user_type", userType)
          .in("post_id", postIds);

        const savedPostIds = new Set((savedPosts || []).map((sp: any) => sp.post_id));
        const dislikedPostIds = new Set((dislikedPosts || []).map((dp: any) => dp.post_id));

        postsWithCounts = postsWithCounts.map((p: any) => ({
          ...p,
          saved: savedPostIds.has(p.id),
          liked: true, // All posts in liked tab are liked
          disliked: dislikedPostIds.has(p.id),
        }));
      }
    } catch (error) {
      console.error("Error fetching saved/disliked status:", error);
    }

    return NextResponse.json({ posts: postsWithCounts });
  } catch (e: any) {
    console.error("Error in GET liked posts:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

