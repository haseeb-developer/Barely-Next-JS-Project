"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { getAnonUserId } from "@/app/lib/anon-auth";
import { motion } from "framer-motion";
import { PostCard } from "@/app/components/PostCard";

export default function MyConfessionsPage() {
  const { user, isSignedIn } = useUser();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const anonId = getAnonUserId();
        const res = await fetch("/api/posts/mine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ anonUserId: anonId || null }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch posts");
        setPosts(data.posts || []);
      } catch (e: any) {
        setError(e.message || "Failed to fetch");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isSignedIn]);

  return (
    <div className="min-h-screen bg-[#1a1b23]">
      <div className="max-w-[1920px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 py-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-[#e4e6eb]">My Confessions</h1>
          <p className="text-[#b9bbbe]">
            Only your posts are shown here.
          </p>
        </div>

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[#b9bbbe]"
          >
            Loading...
          </motion.div>
        )}

        {error && (
          <div className="text-red-400">{error}</div>
        )}

        {!loading && !error && posts.length === 0 && (
          <div className="text-[#b9bbbe]">You haven&apos;t posted any confessions yet.</div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onDelete={() => {
                setPosts((prev) => prev.filter((p) => p.id !== post.id));
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}


