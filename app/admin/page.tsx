"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { isAdminEmail } from "../lib/admin";
import { AnimatePresence, motion } from "framer-motion";

type AnonUser = {
  id: string;
  username: string | null;
  ip_address: string | null;
  profile_picture?: string | null;
  created_at?: string | null;
  country_code?: string | null;
  country_name?: string | null;
  suspension?: { action: "ban" | "terminate"; expires_at: string | null } | null;
};

export default function AdminPanelPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const isAdmin = useMemo(() => {
    const email = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || undefined;
    return isLoaded && isAdminEmail(email);
  }, [isLoaded, user]);

  useEffect(() => {
    if (isLoaded && !isAdmin) {
      router.replace("/home");
    }
  }, [isLoaded, isAdmin, router]);

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AnonUser[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>("ALL");

  // Emoji flags again + readable names
  const toFlagEmoji = (code?: string | null) => {
    if (!code || code.length !== 2) return "🌐";
    const base = 127397;
    const chars = code.toUpperCase().split("").map(c => String.fromCodePoint(base + c.charCodeAt(0)));
    return chars.join("");
  };
  const regionNames = useMemo(() => {
    try {
      return new (Intl as any).DisplayNames(["en"], { type: "region" });
    } catch {
      return { of: (c: string) => c } as any;
    }
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/anon-users", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load users");
      setUsers(data.users || []);
    } catch (e: any) {
      setErr(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) loadUsers();
  }, [isAdmin]);

  const createSuspension = async (subject_type: string, subject_id: string, action: "ban" | "terminate", days?: number) => {
    try {
      const expires_at = action === "terminate" && days ? new Date(Date.now() + days * 24 * 3600 * 1000).toISOString() : null;
      const res = await fetch("/api/admin/suspensions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject_type, subject_id, action, expires_at }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      await loadUsers();
      setToast({ type: "success", message: action === "ban" ? "User banned successfully" : `Terminated for ${days} day(s)` });
    } catch (e: any) {
      setToast({ type: "error", message: e.message || "Failed to apply action" });
    }
  };

  // Build country counts for tabs
  const countryCounts = useMemo(() => {
    const map = new Map<string, { code: string; name: string; count: number }>();
    for (const u of users) {
      const code = (u.country_code || "UN").toUpperCase();
      const name = (regionNames as any).of ? (regionNames as any).of(code) || (code === "UN" ? "Unknown" : code) : (u.country_name || code);
      const key = code;
      const entry = map.get(key);
      if (entry) {
        entry.count++;
      } else {
        map.set(key, { code, name, count: 1 });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [users, regionNames]);

  const filtered = useMemo(
    () => (selectedCountry === "ALL" ? users : users.filter(u => (u.country_code || "UN").toUpperCase() === selectedCountry)),
    [users, selectedCountry]
  );

  // Do not return early before hooks; rendering is gated below

  // Modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmKind, setConfirmKind] = useState<"ban" | "terminate" | "unrestrict" | "reset_tokens" | "reset_tokens_clerk" | null>(null);
  const [targetUser, setTargetUser] = useState<AnonUser | null>(null);
  const [days, setDays] = useState<string>("1");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(id);
  }, [toast]);

  const openBan = (u: AnonUser) => {
    setTargetUser(u);
    setConfirmKind("ban");
    setConfirmOpen(true);
  };
  const openTerminate = (u: AnonUser) => {
    setTargetUser(u);
    setConfirmKind("terminate");
    setDays("1");
    setConfirmOpen(true);
  };
  const openUnrestrict = (u: AnonUser) => {
    setTargetUser(u);
    setConfirmKind("unrestrict");
    setConfirmOpen(true);
  };
  const openGiveTokens = (u: AnonUser) => {
    setTargetUser(u);
    setConfirmKind(null);
    setTokenOpen(true);
    setTokenAmount("0");
  };
  const openResetTokens = (u: AnonUser) => {
    setTargetUser(u);
    setConfirmKind("reset_tokens");
    setConfirmOpen(true);
  };

  const runAction = async () => {
    if (!targetUser || !confirmKind) return;
    try {
      if (confirmKind === "ban") {
        await createSuspension("anonymous", targetUser.id, "ban");
      } else if (confirmKind === "terminate") {
        const d = parseInt(days || "0", 10);
        if (!d || d <= 0) {
          setToast({ type: "error", message: "Enter a valid number of days" });
          return;
        }
        await createSuspension("anonymous", targetUser.id, "terminate", d);
      } else if (confirmKind === "unrestrict") {
        const res = await fetch("/api/admin/suspensions", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject_type: "anonymous", subject_id: targetUser.id }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to unrestrict");
        setToast({ type: "success", message: "Restrictions cleared" });
      } else if (confirmKind === "reset_tokens" || confirmKind === "reset_tokens_clerk") {
        const subjectType = confirmKind === "reset_tokens_clerk" ? "clerk" : ((targetUser as any).user_type || "anonymous");
        const res = await fetch("/api/admin/tokens", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject_type: subjectType, subject_id: targetUser.id }),
        });
        const txt = await res.text();
        const data = txt ? JSON.parse(txt) : {};
        if (!res.ok) throw new Error(data.error || "Failed to reset tokens");
        setToast({ type: "success", message: "Tokens reset to 0" });
      }
    } catch (e: any) {
      setToast({ type: "error", message: e.message || "Action failed" });
    } finally {
      setConfirmOpen(false);
      setTargetUser(null);
      setConfirmKind(null);
    }
  };

  const [tokenOpen, setTokenOpen] = useState(false);
  const [tokenAmount, setTokenAmount] = useState<string>("0");
  const [tokenSubjectType, setTokenSubjectType] = useState<"anonymous" | "clerk">("anonymous");
  const giveTokens = async () => {
    if (!targetUser) return;
    const amt = parseInt(tokenAmount || "0", 10);
    if (!amt || amt <= 0) {
      setToast({ type: "error", message: "Enter a valid token amount" });
      return;
    }
    try {
      const res = await fetch("/api/admin/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject_type: tokenSubjectType, subject_id: targetUser.id, amount: amt }),
      });
      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(text || "Unexpected response");
      }
      if (!res.ok) throw new Error(data.error || "Failed to grant tokens");
      setToast({ type: "success", message: `Granted ${amt} tokens` });
    } catch (e: any) {
      setToast({ type: "error", message: e.message || "Failed to grant tokens" });
    } finally {
      setTokenOpen(false);
      setTargetUser(null);
    }
  };

  // per-row actions dropdown open state (by user id)
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null);
  const toggleMenu = (id: string) => {
    setOpenMenuFor((prev) => (prev === id ? null : id));
  };

  return (
    <div className="max-w-[1920px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 py-10">
      {!isAdmin ? (
        <div className="flex items-center gap-3 text-[#b9bbbe]">
          <div className="w-5 h-5 border-2 border-[#5865f2] border-t-transparent rounded-full animate-spin"></div>
          Redirecting...
        </div>
      ) : (
      <>
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>

      {/* Country Tabs */}
      <div className="mb-6 overflow-x-auto">
        <div className="inline-flex items-center gap-3">
          <button
            onClick={() => setSelectedCountry("ALL")}
            className={`group flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-full border transition-colors shadow-sm ${
              selectedCountry === "ALL"
                ? "bg-[#202637] border-[#3d3f47] text-white"
                : "bg-[#1b1f2a] border-[#2d2f36] text-[#c9cbd1] hover:bg-[#232a3b]"
            }`}
            title="All users"
          >
            <span className="text-[#60a5fa]">🌐</span>
            <span className="font-medium">All</span>
            <span className="ml-1 inline-flex h-5 min-w-[22px] items-center justify-center rounded-full bg-[#0f121a] border border-[#313543] px-1 text-xs text-[#c9cbd1]">
              {users.length.toLocaleString()}
            </span>
          </button>
          {countryCounts.map((c) => (
            <button
              key={c.code}
              onClick={() => setSelectedCountry(c.code)}
              className={`group flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-full border whitespace-nowrap transition-colors shadow-sm ${
                selectedCountry === c.code
                  ? "bg-[#202637] border-[#3d3f47] text-white"
                  : "bg-[#1b1f2a] border-[#2d2f36] text-[#c9cbd1] hover:bg-[#232a3b]"
              }`}
              title={c.name}
            >
              <span className="rounded-full bg-[#0f121a] px-1.5 py-0.5 text-[10px] tracking-wider border border-[#313543] text-[#9aa0a6]">
                {c.code}
              </span>
              <span className="font-medium">{c.name}</span>
              <span className="ml-1 inline-flex h-5 min-w-[22px] items-center justify-center rounded-full bg-[#0f121a] border border-[#313543] px-1 text-xs text-[#c9cbd1]">
                {c.count.toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-[#b9bbbe]">
          <div className="w-5 h-5 border-2 border-[#5865f2] border-t-transparent rounded-full animate-spin"></div>
          Loading users...
        </div>
      ) : err ? (
        <div className="text-red-400">{err}</div>
      ) : (
        <div className="space-y-6">
          {/* My account summary */}
          <div>
            <h2 className="text-xl font-semibold mb-2">My Account</h2>
            <div className="overflow-x-auto rounded-xl border border-[#2d2f36] mb-6">
              <table className="min-w-full text-sm">
                <thead className="bg-[#1f2330] text-[#9aa0a6] text-left">
                  <tr>
                    <th className="px-3 py-2">User</th>
                    <th className="px-3 py-2">ID</th>
                    <th className="px-3 py-2">Country</th>
                    <th className="px-3 py-2">IP</th>
                    <th className="px-3 py-2">Created</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-[#2d2f36]">
                    <td className="px-3 py-2 flex items-center gap-2">
                      <div className="w-7 h-7 overflow-hidden rounded-full border border-[#3d3f47] bg-[#2a2f3f]" />
                      <div className="font-medium">{user?.username || user?.firstName || user?.primaryEmailAddress?.emailAddress || "admin"}</div>
                    </td>
                    <td className="px-3 py-2 text-[#9aa0a6]">{user?.id}</td>
                    <td className="px-3 py-2"><span className="text-[#9aa0a6]">N/A</span></td>
                    <td className="px-3 py-2 text-[#9aa0a6]">N/A</td>
                    <td className="px-3 py-2 text-[#9aa0a6]">{user?.createdAt ? new Date(user.createdAt).toLocaleString() : "—"}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            // create faux target for clerk self
                            setTargetUser({ id: user?.id || "", username: user?.username || user?.firstName || "admin", ip_address: null } as any);
                            setConfirmKind(null);
                            setTokenOpen(true);
                            setTokenAmount("0");
                            setTokenSubjectType("clerk");
                          }}
                          className="px-2 py-1 text-xs rounded-md bg-blue-600/20 text-blue-300 border border-blue-600/30 cursor-pointer"
                          title="Grant tokens"
                        >
                          Give Tokens
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch(`/api/admin/tokens?subject_type=clerk&subject_id=${encodeURIComponent(user?.id || "")}`);
                              const txt = await res.text();
                              const data = txt ? JSON.parse(txt) : {};
                              if (!res.ok) throw new Error(data.error || "Failed to fetch tokens");
                              setToast({ type: "success", message: `Tokens: ${Number(data.balance || 0).toLocaleString()}` });
                            } catch (e: any) {
                              setToast({ type: "error", message: e.message || "Failed to fetch tokens" });
                            }
                          }}
                          className="px-2 py-1 text-xs rounded-md bg-[#2d2f36] text-[#c9cbd1] border border-[#3d3f47] cursor-pointer"
                          title="Show current tokens"
                        >
                          Show Tokens
                        </button>
                        <button
                          onClick={() => {
                            // Create a faux user object for the admin's own account
                            setTargetUser({ id: user?.id || "", username: user?.username || user?.firstName || "admin", ip_address: null, user_type: "clerk" } as any);
                            setConfirmKind("reset_tokens_clerk");
                            setConfirmOpen(true);
                          }}
                          className="px-2 py-1 text-xs rounded-md bg-red-600/20 text-red-300 border border-red-600/30 cursor-pointer"
                          title="Reset tokens to 0"
                        >
                          Reset Coins
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <h2 className="text-xl font-semibold">Anonymous Users</h2>
          <div className="overflow-x-auto rounded-xl border border-[#2d2f36]">
            <table className="min-w-full text-sm">
              <thead className="bg-[#1f2330] text-[#9aa0a6] text-left">
                <tr>
                  <th className="px-3 py-2">User</th>
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Country</th>
                  <th className="px-3 py-2">IP</th>
                  <th className="px-3 py-2">Created</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-t border-[#2d2f36]">
                    <td className="px-3 py-2 flex items-center gap-2">
                      <div className="w-7 h-7 overflow-hidden rounded-full border border-[#3d3f47] bg-[#2a2f3f] flex items-center justify-center">
                        {u.profile_picture ? (
                          // Ensure visible even if image fails to load
                          <img
                            src={u.profile_picture}
                            alt={u.username || "user"}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : null}
                        {!u.profile_picture ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="#9aa0a6"
                            className="w-4 h-4"
                          >
                            <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-3.866 0-7 3.134-7 7h2a5 5 0 015-5 5 5 0 015 5h2c0-3.866-3.134-7-7-7z" />
                          </svg>
                        ) : null}
                      </div>
                      <div className="font-medium">{u.username || "anonymous"}</div>
                    </td>
                    <td className="px-3 py-2 text-[#9aa0a6]">{u.id}</td>
                    <td className="px-3 py-2">
                      <span className="px-2 py-0.5 rounded-full bg-[#1f2330] border border-[#2d2f36] text-xs flex items-center gap-1 w-max">
                        <span>{toFlagEmoji(u.country_code)}</span>
                        <span>{(regionNames as any).of ? (regionNames as any).of((u.country_code || "UN").toUpperCase()) || "Unknown" : (u.country_name || "Unknown")}</span>
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[#9aa0a6]">{u.ip_address || "N/A"}</td>
                    <td className="px-3 py-2 text-[#9aa0a6]">{u.created_at ? new Date(u.created_at).toLocaleString() : "—"}</td>
                    <td className="px-3 py-2 relative">
                      <div className="inline-block">
                        <button
                          onClick={() => toggleMenu(u.id)}
                          className="px-3 py-1.5 rounded-md bg-[#232a3b] border border-[#2d2f36] text-[#e4e6eb] cursor-pointer"
                        >
                          Actions
                        </button>
                        <AnimatePresence>
                          {openMenuFor === u.id && (
                            <motion.div
                              initial={{ opacity: 0, y: -6, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -6, scale: 0.98 }}
                              transition={{ duration: 0.15 }}
                              className="absolute z-[40] mt-2 w-48 right-0 rounded-lg border border-[#2d2f36] bg-[#0f121a] shadow-xl overflow-hidden"
                            >
                              <div className="py-1">
                                {!u.suspension ? (
                                  <>
                                    <button
                                      onClick={() => {
                                        setOpenMenuFor(null);
                                        openBan(u);
                                      }}
                                      className="w-full text-left px-3 py-2 text-sm hover:bg-[#1b2030] text-red-300"
                                    >
                                      Ban
                                    </button>
                                    <button
                                      onClick={() => {
                                        setOpenMenuFor(null);
                                        openTerminate(u);
                                      }}
                                      className="w-full text-left px-3 py-2 text-sm hover:bg-[#1b2030] text-yellow-300"
                                    >
                                      Terminate
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setOpenMenuFor(null);
                                      openUnrestrict(u);
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-[#1b2030] text-green-300"
                                  >
                                    Unrestrict
                                  </button>
                                )}
                                <div className="h-px bg-[#2d2f36] my-1" />
                                <button
                                  onClick={() => {
                                    setOpenMenuFor(null);
                                    openGiveTokens(u);
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-[#1b2030] text-blue-300"
                                >
                                  Give Tokens
                                </button>
                                <button
                                  onClick={() => {
                                    setOpenMenuFor(null);
                                    openResetTokens(u);
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-[#1b2030] text-red-300"
                                >
                                  Reset Tokens
                                </button>
                                <button
                                  onClick={async () => {
                                    setOpenMenuFor(null);
                                    try {
                                      const res = await fetch(`/api/admin/tokens?subject_type=anonymous&subject_id=${encodeURIComponent(u.id)}`);
                                      const txt = await res.text();
                                      const data = txt ? JSON.parse(txt) : {};
                                      if (!res.ok) throw new Error(data.error || "Failed to fetch tokens");
                                      setToast({ type: "success", message: `Tokens: ${Number(data.balance || 0).toLocaleString()}` });
                                    } catch (e: any) {
                                      setToast({ type: "error", message: e.message || "Failed to fetch tokens" });
                                    }
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-[#1b2030] text-[#c9cbd1]"
                                >
                                  Show Tokens
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <AnimatePresence>
        {confirmOpen && (
          <motion.div
            className="fixed inset-0 z-[120] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
              onClick={() => setConfirmOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            />
            <motion.div
              className="relative z-[121] w-full max-w-md rounded-xl bg-[#161922] border border-[#2d2f36] p-5 shadow-xl"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <h3 className="text-lg font-semibold mb-2 capitalize">
                {confirmKind === "ban"
                  ? "Confirm Ban"
                  : confirmKind === "terminate"
                  ? "Confirm Termination"
                  : confirmKind === "unrestrict"
                  ? "Confirm Unrestrict"
                  : confirmKind === "reset_tokens" || confirmKind === "reset_tokens_clerk"
                  ? "Confirm Reset Tokens"
                  : "Confirm Action"}
              </h3>
              <p className="text-[#b9bbbe] mb-4">
                {confirmKind === "ban" && "This will permanently ban the user until you unrestrict."}
                {confirmKind === "terminate" && "Temporarily restrict the user for a number of days."}
                {confirmKind === "unrestrict" && "This will clear any bans/terminations for this user."}
                {(confirmKind === "reset_tokens" || confirmKind === "reset_tokens_clerk") && "Are you sure you want to reset your tokens to 0?"}
              </p>
              {confirmKind === "terminate" && (
                <div className="mb-4">
                  <label className="block text-sm mb-1">Days</label>
                  <input
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    type="number"
                    min={1}
                    className="w-full px-3 py-2 rounded-md bg-[#0f121a] border border-[#2d2f36] outline-none"
                  />
                </div>
              )}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setConfirmOpen(false)}
                  className="px-3 py-1.5 rounded-md border border-[#2d2f36] bg-[#1f2330] text-[#c9cbd1] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={runAction}
                  className="px-3 py-1.5 rounded-md bg-[#5865f2] text-white cursor-pointer"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Give Tokens Modal */}
      <AnimatePresence>
        {tokenOpen && (
          <motion.div
            className="fixed inset-0 z-[120] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
              onClick={() => setTokenOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="relative z-[121] w-full max-w-md rounded-xl bg-[#161922] border border-[#2d2f36] p-5 shadow-xl"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <h3 className="text-lg font-semibold mb-2">Grant Tokens</h3>
              <p className="text-[#b9bbbe] mb-4">Enter the number of tokens to grant. Only numbers are allowed.</p>
              <input
                value={tokenAmount}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^\d]/g, "");
                  setTokenAmount(v);
                }}
                type="text"
                inputMode="numeric"
                className="w-full px-3 py-2 rounded-md bg-[#0f121a] border border-[#2d2f36] outline-none mb-4"
                placeholder="e.g. 200000"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setTokenOpen(false)}
                  className="px-3 py-1.5 rounded-md border border-[#2d2f36] bg-[#1f2330] text-[#c9cbd1] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={giveTokens}
                  className="px-3 py-1.5 rounded-md bg-[#5865f2] text-white cursor-pointer"
                >
                  Grant
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="fixed top-6 right-6 z-[130]"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className={`px-4 py-2 rounded-lg shadow-lg border ${
                toast.type === "success"
                  ? "bg-[#0f121a] border-green-600/40 text-green-300"
                  : "bg-[#0f121a] border-red-600/40 text-red-300"
              }`}
            >
              {toast.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </>
      )}
    </div>
  );
}


