import { createClient, SupabaseClient, User } from "@supabase/supabase-js";
import { SupabaseConfig } from "../types/auth";

const STORAGE_KEY = "syncnote_supabase_config";

export const getDefaultConfig = (): SupabaseConfig => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || "";
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || "";
  const savedUrl = localStorage.getItem("syncnote_supabase_url") || "";
  const savedKey = localStorage.getItem("syncnote_supabase_key") || "";

  return {
    url: envUrl || savedUrl,
    anonKey: envKey || savedKey,
    workspaceId: "default-workspace",
  };
};

export const saveConfig = (config: SupabaseConfig) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  if (config.url) localStorage.setItem("syncnote_supabase_url", config.url);
  if (config.anonKey) localStorage.setItem("syncnote_supabase_key", config.anonKey);
};

export const getOAuthRedirectUrl = (): string => {
  if (typeof window === "undefined") return "http://localhost:5173";

  // 1. Desktop app (Tauri v2) - Always use custom protocol deep link
  const isTauriApp =
    (window as any).__TAURI_INTERNALS__ !== undefined ||
    window.location.origin.includes("tauri.localhost") ||
    window.location.protocol === "tauri:";

  if (isTauriApp) {
    return "syncnote://auth/callback";
  }

  // 2. Development environment in web browser (Vite dev server)
  const isDevHost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  if (import.meta.env.DEV || (isDevHost && window.location.port === "5173")) {
    return window.location.origin || "http://localhost:5173";
  }

  // 3. Web browser production (e.g. deployed on Vercel / custom domain)
  return window.location.origin;
};

let cachedClient: SupabaseClient | null = null;
let cachedConfigKey = "";

export const getSupabaseClient = (customConfig?: SupabaseConfig): SupabaseClient | null => {
  const config = customConfig || getDefaultConfig();
  if (!config.url || !config.anonKey) {
    return null;
  }
  const configKey = `${config.url}::${config.anonKey}`;
  if (!cachedClient || cachedConfigKey !== configKey) {
    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== "undefined" ? window.localStorage : undefined,
      },
      realtime: {
        params: {
          eventsPerSecond: 20,
        },
      },
    });
    cachedConfigKey = configKey;
  }
  return cachedClient;
};

// Lazy proxy for direct supabase usage
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error("Supabase client is not configured yet.");
    }
    return (client as any)[prop];
  },
});

export const requireSupabaseClient = (customConfig?: SupabaseConfig): SupabaseClient => {
  const client = getSupabaseClient(customConfig);
  if (!client) {
    throw new Error(
      "Nilai VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY di file .env masih kosong! Silakan buka file .env dan isi dengan URL & Anon Key dari Supabase Dashboard kamu."
    );
  }
  return client;
};

export const signInWithGoogle = async () => {
  const client = requireSupabaseClient();
  const redirectTo = getOAuthRedirectUrl();
  console.log("[Auth] Initiating Google OAuth with redirectTo:", redirectTo);

  const isTauriApp =
    typeof window !== "undefined" &&
    ((window as any).__TAURI_INTERNALS__ !== undefined ||
      window.location.origin.includes("tauri.localhost") ||
      window.location.protocol === "tauri:");

  if (isTauriApp) {
    // In Tauri desktop: Skip WebView redirect and open in external system browser
    const { data, error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: true,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) throw error;

    if (data?.url) {
      console.log("[Auth] Opening Google OAuth in system default browser:", data.url);
      try {
        const { openUrl } = await import("@tauri-apps/plugin-opener");
        await openUrl(data.url);
      } catch (openerErr) {
        console.warn("[Auth] plugin-opener failed, trying invoke fallback:", openerErr);
        try {
          const { invoke } = await import("@tauri-apps/api/core");
          await invoke("open_external_url", { url: data.url });
        } catch (invokeErr) {
          console.error("[Auth] Failed to open external browser:", invokeErr);
          window.open(data.url, "_blank");
        }
      }
    }
    return data;
  }

  // Standard web browser flow
  const { data, error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) throw error;
  return data;
};

export const signInWithEmail = async (email: string, password: string) => {
  const client = requireSupabaseClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
};

export const signUpWithEmail = async (email: string, password: string) => {
  const client = requireSupabaseClient();
  const { data, error } = await client.auth.signUp({ email, password });
  if (error) throw error;
  return data.user;
};

export const signOut = async () => {
  const client = requireSupabaseClient();
  await client.auth.signOut();
};

export const getCurrentUser = async (): Promise<User | null> => {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data } = await client.auth.getUser();
  return data.user;
};
