"use client";

// Get user's IP address
export async function getUserIP(): Promise<string | null> {
  try {
    // Try to get IP from a public API
    const response = await fetch("https://api.ipify.org?format=json");
    if (response.ok) {
      const data = await response.json();
      return data.ip;
    }
  } catch {
    // Fallback to other service
    try {
      const response = await fetch("https://ipapi.co/ip/");
      if (response.ok) {
        return await response.text();
      }
    } catch {
      // If both fail, return null
    }
  }
  return null;
}

// Check if IP is banned
export async function isIPBanned(ipAddress: string): Promise<{ banned: boolean; reason?: string }> {
  try {
    const { createClient } = await import("@/app/lib/supabase/client");
    const supabase = createClient();

    // Some environments may have an older schema without the "reason" column.
    // Select all columns to avoid 406 errors from PostgREST when requesting a missing column.
    const { data, error } = await supabase
      .from("banned_ips")
      .select("*")
      .eq("ip_address", ipAddress)
      .eq("is_permanent", true)
      .maybeSingle();

    if (error || !data) {
      return { banned: false };
    }

    return { banned: true, reason: (data as any).reason };
  } catch {
    return { banned: false };
  }
}

// Ban an IP address (calls API route)
export async function banIPAddress(ipAddress: string, reason: string): Promise<boolean> {
  try {
    const response = await fetch("/api/ban-ip", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ipAddress, reason }),
    });
    
    const data = await response.json();
    return data.success === true;
  } catch {
    return false;
  }
}

