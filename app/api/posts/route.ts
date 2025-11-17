import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { checkProfanityServer } from "@/app/lib/profanity-check-server";
import { isAdminEmail } from "@/app/lib/admin";

// GET - Fetch all posts with likes/dislikes counts
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get("filter") || "all"; // all, recent, popular, trending
    const tag = searchParams.get("tag"); // Filter by specific tag

    // Build query based on filter
    let query = supabase
      .from("confessions_posts")
      .select(`
        *,
        likes:confessions_likes(count),
        dislikes:confessions_dislikes(count)
      `)
      .order("created_at", { ascending: false });

    // Filter by tag if provided
    if (tag) {
      const normalizedTag = tag.toLowerCase().trim();
      query = query.contains("tags", [normalizedTag]);
    }

    // Apply filters
    if (filter === "popular") {
      // Order by total engagement (likes - dislikes)
      query = supabase
        .from("confessions_posts")
        .select(`
          *,
          likes:confessions_likes(count),
          dislikes:confessions_dislikes(count)
        `)
        .order("created_at", { ascending: false });
    }

    const { data: posts, error } = await query;

    if (error) {
      console.error("Error fetching posts:", error);
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

    // Attach profile pictures
    try {
      // 1) Anonymous users: read from anon_users
      const anonUserIds = postsWithCounts
        .filter((p: any) => p.user_type === "anonymous")
        .map((p: any) => p.user_id);
      if (anonUserIds.length > 0) {
        const { data: anonProfiles } = await supabase
          .from("anon_users")
          .select("id, profile_picture, username, username_color, username_color_gradient, animated_gradient_enabled")
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
        }));
      }

      // 2) Clerk users: fetch current image URLs via Clerk server SDK so images stay up-to-date
      const clerkIds = postsWithCounts
        .filter((p: any) => p.user_type === "clerk")
        .map((p: any) => p.user_id);
      if (clerkIds.length > 0) {
        const anyClerk: any = await import("@clerk/nextjs/server");
        const client = anyClerk.clerkClient ? anyClerk.clerkClient : null;
        if (client) {
          let users: any[] = [];
          // Also resolve admin Clerk user IDs from the admin email list to ensure everyone sees the badge
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
          // Also fetch verified owner by email to ensure we always have the correct user ID
          try {
            const verifiedOwnerEmail = "haseeb.devv@gmail.com";
            const resVerified = await client.users.getUserList({ emailAddress: [verifiedOwnerEmail] });
            const verifiedList = (resVerified?.data || resVerified || []) as any[];
            verifiedOwnerIds = new Set(verifiedList.map((u: any) => u.id));
            console.log("[Verified Badge] Found verified owner IDs:", Array.from(verifiedOwnerIds));
          } catch (err) {
            console.error("[Verified Badge] Error fetching verified owner:", err);
          }
          try {
            // Prefer batch API if available
            if (client.users?.getUserList) {
              const res = await client.users.getUserList({ userId: clerkIds });
              users = res?.data || res || [];
            } else if (client.users?.getUser) {
              // Fallback: fetch sequentially
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
              isAdmin: adminUserIds.has(u.id) || isAdminEmail(primary),
              isVerifiedOwner: isVerifiedOwner
            }];
          }));
          postsWithCounts = postsWithCounts.map((p: any) => {
            const clerkData = clerkMap.get(p.user_id);
            const isVerified = p.user_type === "clerk" ? !!clerkData?.isVerifiedOwner : false;
            if (isVerified) {
              console.log(`[Verified Badge] Post ${p.id} by ${p.user_id} is verified owner`);
            }
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
      // Non-fatal if Clerk lookup fails
    }

    // Sort by popularity if filter is "popular"
    if (filter === "popular") {
      postsWithCounts.sort((a, b) => {
        const aScore = a.likes_count - a.dislikes_count;
        const bScore = b.likes_count - b.dislikes_count;
        return bScore - aScore;
      });
    }

    // Batch fetch user's saved/liked/disliked status for all posts
    try {
      const { userId: clerkUserId } = await auth();
      const anonUserId = searchParams.get("anonUserId");
      const userId = clerkUserId || anonUserId;
      const userType = clerkUserId ? "clerk" : "anonymous";

      if (userId && postsWithCounts.length > 0) {
        const postIds = postsWithCounts.map((p: any) => p.id);

        // Batch fetch saved posts
        const { data: savedPosts } = await supabase
          .from("saved_posts")
          .select("post_id")
          .eq("user_id", userId)
          .eq("user_type", userType)
          .in("post_id", postIds);

        // Batch fetch liked posts
        const { data: likedPosts } = await supabase
          .from("confessions_likes")
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

        // Create sets for quick lookup
        const savedPostIds = new Set((savedPosts || []).map((sp: any) => sp.post_id));
        const likedPostIds = new Set((likedPosts || []).map((lp: any) => lp.post_id));
        const dislikedPostIds = new Set((dislikedPosts || []).map((dp: any) => dp.post_id));

        // Get save counts for posts where user is the author
        const userPostIds = postsWithCounts
          .filter((p: any) => p.user_id === userId)
          .map((p: any) => p.id);
        
        let saveCountsMap = new Map<string, number>();
        if (userPostIds.length > 0) {
          const { data: allSaves } = await supabase
            .from("saved_posts")
            .select("post_id")
            .in("post_id", userPostIds);
          
          const counts = new Map<string, number>();
          (allSaves || []).forEach((save: any) => {
            counts.set(save.post_id, (counts.get(save.post_id) || 0) + 1);
          });
          saveCountsMap = counts;
        }

        // Attach flags to posts
        postsWithCounts = postsWithCounts.map((p: any) => ({
          ...p,
          saved: savedPostIds.has(p.id),
          liked: likedPostIds.has(p.id),
          disliked: dislikedPostIds.has(p.id),
          saveCount: p.user_id === userId ? (saveCountsMap.get(p.id) || 0) : null,
        }));
      } else {
        // No user, set all to false
        postsWithCounts = postsWithCounts.map((p: any) => ({
          ...p,
          saved: false,
          liked: false,
          disliked: false,
        }));
      }
    } catch (error) {
      console.error("Error fetching user interaction status:", error);
      // Non-fatal - just set all to false
      postsWithCounts = postsWithCounts.map((p: any) => ({
        ...p,
        saved: false,
        liked: false,
        disliked: false,
      }));
    }

    return NextResponse.json({ posts: postsWithCounts });
  } catch (error) {
    console.error("Error in GET /api/posts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new post
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    const body = await request.json();
    const { content, tags, anonUserId, anonUsername, clerkUsername } = body;

    // Authentication check - user must be logged in (either Clerk or anonymous)
    if (!clerkUserId && !anonUserId) {
      return NextResponse.json(
        { error: "Authentication required. Please sign in to post." },
        { status: 401 }
      );
    }

    // Validate content
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Validate word count (min 10, max 50 words) — skip for admin
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;

    // Determine early if the request is from an admin Clerk user (bypass limits)
    let isAdminFlag = false;
    if (clerkUserId) {
      try {
        const user = await currentUser();
        const primary = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || null;
        if (primary) isAdminFlag = isAdminEmail(primary);
      } catch {}
    }

    if (!isAdminFlag && wordCount < 10) {
      return NextResponse.json(
        { error: "Confession must be at least 10 words" },
        { status: 400 }
      );
    }

    if (!isAdminFlag && wordCount > 50) {
      return NextResponse.json(
        { error: "Confession must be 50 words or less" },
        { status: 400 }
      );
    }

    // Check for profanity
    const isClean = await checkProfanityServer(content.trim());
    if (!isAdminFlag && !isClean) {
      return NextResponse.json(
        { error: "Your confession contains inappropriate content. Please revise it." },
        { status: 400 }
      );
    }

    // Determine user type and ID
    let userId: string;
    let userType: "clerk" | "anonymous";
    let username: string;
    let profilePicture: string | null = null;
    let isVerifiedOwner = false;

    if (clerkUserId) {
      // Clerk user
      userId = clerkUserId;
      userType = "clerk";
      username = clerkUsername || "User";
      // Fetch Clerk user's image URL so everyone can see it without needing client context
      try {
        const user = await currentUser();
        profilePicture = user?.imageUrl ?? null;
        const primary = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || null;
        if (primary) {
          isAdminFlag = isAdminEmail(primary) || isAdminFlag;
          isVerifiedOwner = primary.toLowerCase() === "haseeb.devv@gmail.com";
        }
      } catch (e) {
        profilePicture = null;
      }
    } else if (anonUserId && anonUsername) {
      // Anonymous user
      userId = anonUserId;
      userType = "anonymous";
      username = anonUsername;
    } else {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // Process tags (ensure it's an array)
    let tagsArray: string[] = [];
    if (tags) {
      if (Array.isArray(tags)) {
        tagsArray = tags.filter(tag => typeof tag === "string" && tag.trim().length > 0);
      } else if (typeof tags === "string") {
        // Handle case where tags might be sent as a string
        tagsArray = tags.split(",")
          .map(tag => tag.trim().replace(/^#+/, "").toLowerCase())
          .filter(tag => tag.length > 0);
      }
    }

    // Validate tag length (max 8 characters per tag)
    for (const tag of tagsArray) {
      if (tag.length > 8) {
        return NextResponse.json(
          { error: `Tag "${tag}" exceeds 8 characters. Each tag must be 8 characters or less.` },
          { status: 400 }
        );
      }
    }

    // Check tags for profanity
    for (const tag of tagsArray) {
      const isClean = await checkProfanityServer(tag);
      if (!isClean) {
        return NextResponse.json(
          { error: `Tag "${tag}" contains inappropriate content. Please revise it.` },
          { status: 400 }
        );
      }
    }

    // Prepare insert data
    const insertData: any = {
      content: content.trim(),
      tags: tagsArray, // Always include tags (empty array if none)
      user_id: userId,
      user_type: userType,
      username: username,
    };

    if (isAdminFlag) {
      insertData.is_admin = true;
    }

    if (profilePicture) {
      insertData.profile_picture = profilePicture;
    }

    const { data: post, error } = await supabase
      .from("confessions_posts")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Error creating post:", error);
      // Return more detailed error message
      return NextResponse.json(
        { error: error.message || "Failed to create post. Make sure the tags column exists in your database." },
        { status: 500 }
      );
    }

    return NextResponse.json({ post: { ...post, likes_count: 0, dislikes_count: 0, is_verified_owner: isVerifiedOwner } });
  } catch (error) {
    console.error("Error in POST /api/posts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

