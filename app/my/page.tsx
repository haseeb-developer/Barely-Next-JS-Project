"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { getAnonUserId } from "@/app/lib/anon-auth";
import { motion, AnimatePresence } from "framer-motion";
import { PostCard } from "@/app/components/PostCard";
import { BookOpen, Heart, FileText } from "lucide-react";

type TabType = "my-posts" | "saved" | "liked";

export default function MyActivityPage() {
  const { user, isSignedIn } = useUser();
  const [activeTab, setActiveTab] = useState<TabType>("my-posts");
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = async (tab: TabType) => {
    setLoading(true);
    setError(null);
    try {
      const anonId = getAnonUserId();
      let url = "";
      
      if (tab === "my-posts") {
        url = "/api/posts/mine";
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ anonUserId: anonId || null }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch posts");
        setPosts(data.posts || []);
      } else if (tab === "saved") {
        url = `/api/posts/saved${anonId ? `?anonUserId=${encodeURIComponent(anonId)}` : ""}`;
        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch saved posts");
        setPosts(data.posts || []);
      } else if (tab === "liked") {
        url = `/api/posts/liked${anonId ? `?anonUserId=${encodeURIComponent(anonId)}` : ""}`;
        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch liked posts");
        setPosts(data.posts || []);
      }
    } catch (e: any) {
      setError(e.message || "Failed to fetch");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(activeTab);
  }, [activeTab, isSignedIn]);

  // Listen for unsave/unlike events and remove posts from the list
  useEffect(() => {
    const handlePostUnsaved = (e: CustomEvent) => {
      if (activeTab === "saved") {
        setPosts((prev) => prev.filter((p) => p.id !== e.detail.postId));
      }
    };

    const handlePostUnliked = (e: CustomEvent) => {
      if (activeTab === "liked") {
        setPosts((prev) => prev.filter((p) => p.id !== e.detail.postId));
      }
    };

    window.addEventListener("postUnsaved", handlePostUnsaved as EventListener);
    window.addEventListener("postUnliked", handlePostUnliked as EventListener);

    return () => {
      window.removeEventListener("postUnsaved", handlePostUnsaved as EventListener);
      window.removeEventListener("postUnliked", handlePostUnliked as EventListener);
    };
  }, [activeTab]);

  const tabs = [
    { id: "my-posts" as TabType, label: "My Confessions", icon: FileText },
    { id: "saved" as TabType, label: "Saved Confessions", icon: BookOpen },
    { id: "liked" as TabType, label: "Liked Confessions", icon: Heart },
  ];

  return (
    <div className="min-h-screen bg-[#1a1b23]">
      <div className="max-w-[1920px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 py-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-[#e4e6eb] mb-2">My Activity</h1>
          <p className="text-[#b9bbbe]">
            View your confessions, saved posts, and liked posts.
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-[#2d2f36]">
          <div className="flex flex-wrap gap-2 sm:gap-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base font-medium transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? "border-[#5865f2] text-[#5865f2]"
                      : "border-transparent text-[#b9bbbe] hover:text-[#e4e6eb] hover:border-[#3d3f47]"
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-20"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-10 h-10 border-4 border-[#5865f2] border-t-transparent rounded-full"
            />
            <span className="ml-3 text-[#b9bbbe]">Loading...</span>
          </motion.div>
        )}

        {error && (
          <div className="text-red-400 p-4 bg-red-500/10 rounded-lg border border-red-500/20">
            {error}
          </div>
        )}

        {!loading && !error && posts.length === 0 && (
          <div className="text-center py-20">
            <div className="text-[#b9bbbe] text-lg mb-2">
              {activeTab === "my-posts" && "You haven't posted any confessions yet."}
              {activeTab === "saved" && "You haven't saved any confessions yet."}
              {activeTab === "liked" && "You haven't liked any confessions yet."}
            </div>
            <p className="text-[#9aa0a6] text-sm">
              {activeTab === "saved" && "Click the bookmark icon on any post to save it."}
              {activeTab === "liked" && "Like posts to see them here."}
            </p>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 gap-4"
          >
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onDelete={() => {
                  setPosts((prev) => prev.filter((p) => p.id !== post.id));
                }}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}


