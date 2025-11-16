/* eslint-disable @next/next/no-img-element */
"use client";

import { motion, type Variants } from "framer-motion";
import { Sparkles, ShieldCheck, Users, Flame, Hash, MessageCircle, Lock, Eye, Star, Rocket } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 120, damping: 16 },
  },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-[#111318]">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-[520px] h-[520px] rounded-full bg-[#5865f2]/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-[520px] h-[520px] rounded-full bg-fuchsia-500/20 blur-3xl" />

        <div className="max-w-[1920px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 pt-16 lg:pt-24 pb-10 lg:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 16 }}
            className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center"
          >
            <div>
              <motion.h1
                className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight text-white"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
              >
                Say it freely. Share it safely.
              </motion.h1>
              <motion.p
                className="mt-4 text-base sm:text-lg lg:text-xl text-[#b9bbbe] max-w-2xl"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
              >
                Confessions that feel effortless — with real-time trends, tags, likes, and a respectful community.
                Sign in with Clerk or go anonymous. Your voice, your choice.
              </motion.p>
              <motion.div
                className="mt-8 flex flex-wrap gap-3"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 }}
              >
                <Link href="/discover" className="cursor-pointer">
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-3 rounded-xl bg-[#5865f2] hover:bg-[#4752c4] text-white font-semibold shadow-lg shadow-[#5865f2]/25"
                  >
                    Explore Confessions
                  </motion.button>
                </Link>
                <Link href="/anon-account" className="cursor-pointer">
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-3 rounded-xl bg-[#1a1b23] border border-[#3d3f47] text-[#e4e6eb] hover:bg-[#2a2c33]"
                  >
                    Create Anonymous Account
                  </motion.button>
                </Link>
              </motion.div>
              <motion.div
                className="mt-6 flex flex-wrap gap-4 text-xs text-[#8c8f93]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.24 }}
              >
                <div className="inline-flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  RLS-protected database & server-side filtering
                </div>
                <div className="inline-flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  Framer Motion animations everywhere
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98, rotate: -1 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 150, damping: 15 }}
              className="relative"
            >
              <div className="relative rounded-2xl bg-gradient-to-br from-[#1a1b23] to-[#1d1f28] border border-[#2e313a] p-6 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#5865f210,transparent_40%),radial-gradient(circle_at_80%_0%,#f472b620,transparent_40%)]" />
                <div className="grid grid-cols-2 gap-4 relative">
                  {[
                    { Icon: MessageCircle, title: "Confess", text: "Post with tags, like/dislike, and trends." },
                    { Icon: Users, title: "Two Accounts", text: "Clerk or Anonymous — switch any time." },
                    { Icon: Hash, title: "Trending Tags", text: "Global, auto-ranked, clickable filters." },
                    { Icon: Flame, title: "Moderation", text: "Smart profanity filter + flag & auto-delete." },
                  ].map((f, i) => (
                    <motion.div
                      key={i}
                      variants={item}
                      initial="hidden"
                      whileInView="show"
                      viewport={{ once: true, amount: 0.4 }}
                      className="rounded-xl bg-[#14161d] border border-[#2a2c35] p-4"
                    >
                      <f.Icon className="w-6 h-6 text-[#5865f2]" />
                      <p className="mt-2 text-white font-semibold">{f.title}</p>
                      <p className="text-sm text-[#9aa0a6]">{f.text}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-14 lg:py-20">
        <div className="max-w-[1920px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                icon: <Lock className="w-6 h-6 text-emerald-400" />,
                title: "Anonymous Mode",
                desc: "No emails displayed. Usernames like anon-yourname. Data persists via Supabase.",
              },
              {
                icon: <Eye className="w-6 h-6 text-blue-400" />,
                title: "Live Profiles",
                desc: "Clerk avatars and usernames update across all posts instantly.",
              },
              {
                icon: <Hash className="w-6 h-6 text-fuchsia-400" />,
                title: "Powerful Tags",
                desc: "Auto-comma assist, 8-char max per tag, profanity checks, global trending.",
              },
              {
                icon: <ShieldCheck className="w-6 h-6 text-amber-300" />,
                title: "Community Safety",
                desc: "Flag posts. 15 flags auto-delete across the platform. Admin can reset flags.",
              },
              {
                icon: <Star className="w-6 h-6 text-yellow-300" />,
                title: "Tokens System",
                desc: "Earn 50 tokens daily on active login. More features coming soon.",
              },
              {
                icon: <Rocket className="w-6 h-6 text-cyan-300" />,
                title: "Blazing UX",
                desc: "Framer Motion throughout: buttons, dropdowns, modals, lists, and icons.",
              },
            ].map((f, i) => (
              <motion.div
                key={i}
                variants={item}
                className="rounded-2xl bg-[#14161d] border border-[#2a2c35] p-6 hover:border-[#3b3f4a] transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-[#1b1e27] border border-[#2a2c35] flex items-center justify-center">
                  {f.icon}
                </div>
                <h3 className="mt-4 text-white font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-[#9aa0a6]">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Account Comparison */}
      <section className="py-14 lg:py-20 border-t border-[#1e2230]">
        <div className="max-w-[1920px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-10">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-2xl bg-[#14161d] border border-[#2a2c35] p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1b1e27] border border-[#2a2c35] flex items-center justify-center">
                  <Users className="w-6 h-6 text-[#5865f2]" />
                </div>
                <h3 className="text-white font-semibold">Clerk Account</h3>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-[#9aa0a6]">
                <li>• Profile image and username synced from Clerk</li>
                <li>• Posts show your display name & avatar for everyone</li>
                <li>• Access to tokens and all advanced features</li>
              </ul>
              <div className="mt-6">
                <Link href="/discover" className="cursor-pointer">
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="px-5 py-2.5 rounded-xl bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium">
                    Continue with Clerk
                  </motion.button>
                </Link>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-2xl bg-[#14161d] border border-[#2a2c35] p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1b1e27] border border-[#2a2c35] flex items-center justify-center">
                  <Lock className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-white font-semibold">Anonymous Account</h3>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-[#9aa0a6]">
                <li>• Email not shown. Username auto-prefixed: anon-yourname</li>
                <li>• Optional profile picture (via Settings) applied everywhere</li>
                <li>• Persistent posts, likes, tokens via Supabase</li>
              </ul>
              <div className="mt-6">
                <Link href="/anon-account" className="cursor-pointer">
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="px-5 py-2.5 rounded-xl bg-[#1a1b23] border border-[#3d3f47] text-[#e4e6eb] hover:bg-[#2a2c33]">
                    Create Anonymous Account
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-24">
        <div className="max-w-[1920px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-3xl bg-gradient-to-br from-[#1a1b23] to-[#1f2230] border border-[#2a2c35] p-8 lg:p-12 overflow-hidden relative"
          >
            <div className="absolute -right-16 -top-16 w-80 h-80 bg-[#5865f2]/20 blur-3xl rounded-full" />
            <div className="absolute -left-16 -bottom-16 w-80 h-80 bg-fuchsia-500/20 blur-3xl rounded-full" />
            <div className="relative">
              <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-10">
                <div className="flex-1">
                  <h3 className="text-2xl lg:text-3xl font-bold text-white">Ready to share yours?</h3>
                  <p className="mt-2 text-[#b9bbbe]">
                    Head to Discover, see what’s trending, and click Confess. We’ll take care of the rest.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Link href="/discover" className="cursor-pointer">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }} className="px-6 py-3 rounded-xl bg-[#5865f2] hover:bg-[#4752c4] text-white font-semibold">
                      Discover Now
                    </motion.button>
                  </Link>
                  <Link href="/terms" className="cursor-pointer">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }} className="px-6 py-3 rounded-xl bg-[#1a1b23] border border-[#3d3f47] text-[#e4e6eb] hover:bg-[#2a2c33]">
                      Learn the Rules
                    </motion.button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

