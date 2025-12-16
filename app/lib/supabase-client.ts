import { createClient } from "@supabase/supabase-js";

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

// Custom storage adapter dengan fallback untuk mobile browsers
const createCustomStorage = () => {
  if (typeof window === "undefined") return undefined;

  return {
    getItem: (key: string) => {
      try {
        // Try localStorage first
        const item = window.localStorage.getItem(key);
        if (item) return item;

        // Fallback to sessionStorage
        return window.sessionStorage.getItem(key);
      } catch (error) {
        console.warn("Storage getItem error:", error);
        return null;
      }
    },
    setItem: (key: string, value: string) => {
      try {
        // Save to both localStorage and sessionStorage for redundancy
        window.localStorage.setItem(key, value);
        window.sessionStorage.setItem(key, value);
      } catch (error) {
        console.warn("Storage setItem error:", error);
        // Fallback to sessionStorage only
        try {
          window.sessionStorage.setItem(key, value);
        } catch (e) {
          console.error("Failed to save session:", e);
        }
      }
    },
    removeItem: (key: string) => {
      try {
        window.localStorage.removeItem(key);
        window.sessionStorage.removeItem(key);
      } catch (error) {
        console.warn("Storage removeItem error:", error);
      }
    },
  };
};

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: true,
    storage: createCustomStorage(),
    // Tambahan untuk mobile stability
    storageKey: "mykelas-auth-token",
    flowType: "pkce", // Lebih aman untuk mobile
  },
});
