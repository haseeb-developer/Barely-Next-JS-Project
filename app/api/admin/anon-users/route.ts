import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import { isAdminEmail } from "@/app/lib/admin";

type CountryInfo = { code: string | null; name: string | null };

const cache = new Map<string, CountryInfo>();

function isPrivateIp(ip?: string | null) {
  if (!ip) return true;
  const x = ip.trim();
  return (
    x === "127.0.0.1" ||
    x === "::1" ||
    x.startsWith("10.") ||
    x.startsWith("192.168.") ||
    x.startsWith("172.16.") ||
    x.startsWith("172.17.") ||
    x.startsWith("172.18.") ||
    x.startsWith("172.19.") ||
    x.startsWith("172.20.") ||
    x.startsWith("172.21.") ||
    x.startsWith("172.22.") ||
    x.startsWith("172.23.") ||
    x.startsWith("172.24.") ||
    x.startsWith("172.25.") ||
    x.startsWith("172.26.") ||
    x.startsWith("172.27.") ||
    x.startsWith("172.28.") ||
    x.startsWith("172.29.") ||
    x.startsWith("172.30.") ||
    x.startsWith("172.31.")
  );
}

async function lookupCountry(ip?: string | null): Promise<CountryInfo> {
  if (!ip || isPrivateIp(ip)) return { code: null, name: null };
  if (cache.has(ip)) return cache.get(ip)!;

  // Try multiple providers in order
  const attempts = [
    async () => {
      const r = await fetch(`https://ipapi.co/${ip}/json/`, { cache: "no-store" });
      if (!r.ok) return null;
      const j: any = await r.json();
      const code = (j?.country_code || j?.country || "").toString().trim() || null;
      const name = (j?.country_name || "").toString().trim() || null;
      return code || name ? { code, name } : null;
    },
    async () => {
      const r = await fetch(`https://ipwho.is/${ip}`, { cache: "no-store" });
      if (!r.ok) return null;
      const j: any = await r.json();
      const code = (j?.country_code || "").toString().trim() || null;
      const name = (j?.country || "").toString().trim() || null;
      return code || name ? { code, name } : null;
    },
    async () => {
      const r = await fetch(`https://ipapi.co/${ip}/country/`, { cache: "no-store" });
      if (!r.ok) return null;
      const code = (await r.text()).trim() || null;
      return code ? { code, name: null } : null;
    },
  ];

  for (const fn of attempts) {
    try {
      const out = await fn();
      if (out) {
        cache.set(ip, out);
        return out;
      }
    } catch {}
  }
  return { code: null, name: null };
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    // safer: fetch current user for email
    let isAdmin = false;
    try {
      const u = await (await import("@clerk/nextjs/server")).currentUser();
      const primary = u?.primaryEmailAddress?.emailAddress || u?.emailAddresses?.[0]?.emailAddress || null;
      isAdmin = isAdminEmail(primary || undefined);
    } catch {}
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("anon_users")
      .select("id, username, ip_address, profile_picture, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) return NextResponse.json({ error: "Failed to load users" }, { status: 500 });

    const withCountry = await Promise.all(
      (data || []).map(async (u) => {
        const info = await lookupCountry(u.ip_address);
        return { ...u, country_code: info.code, country_name: info.name };
      })
    );

    // Fetch active suspensions for anonymous users
    const nowIso = new Date().toISOString();
    const { data: suspensions } = await supabase
      .from("user_suspensions")
      .select("subject_id, action, expires_at, active")
      .eq("subject_type", "anonymous")
      .eq("active", true);

    const suspMap = new Map<string, { action: string; expires_at: string | null }>();
    (suspensions || []).forEach((s: any) => {
      if (!s.expires_at || s.expires_at > nowIso) {
        suspMap.set(s.subject_id, { action: s.action, expires_at: s.expires_at || null });
      }
    });

    const merged = (withCountry || []).map((u: any) => ({
      ...u,
      suspension: suspMap.get(u.id) || null,
    }));

    return NextResponse.json({ users: merged });
  } catch (e) {
    console.error("admin/anon-users error", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


