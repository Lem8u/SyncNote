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

const defaultConfig = getDefaultConfig();

// Create client only if valid URL is present, otherwise fallback dummy
export const supabase: SupabaseClient = createClient(
  defaultConfig.url || "https://your-project.supabase.co",
  defaultConfig.anonKey || "your-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
    },
    realtime: {
      params: {
        eventsPerSecond: 20,
      },
    },
  }
);

export const getSupabaseClient = (customConfig?: SupabaseConfig): SupabaseClient => {
  const config = customConfig || getDefaultConfig();
  if (config.url && config.anonKey) {
    return createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
      },
    });
  }
  return supabase;
};

export const signInWithGoogle = async () => {
  const config = getDefaultConfig();
  if (!config.url || !config.anonKey) {
    throw new Error(
      "Nilai VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY di file .env masih kosong! Silakan buka file .env dan isi dengan URL & Anon Key dari Supabase Dashboard kamu."
    );
  }

  const client = getSupabaseClient(config);
  const { data, error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin,
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
  const config = getDefaultConfig();
  const client = getSupabaseClient(config);
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
};

export const signUpWithEmail = async (email: string, password: string) => {
  const config = getDefaultConfig();
  const client = getSupabaseClient(config);
  const { data, error } = await client.auth.signUp({ email, password });
  if (error) throw error;
  return data.user;
};

export const signOut = async () => {
  const config = getDefaultConfig();
  const client = getSupabaseClient(config);
  await client.auth.signOut();
};

export const getCurrentUser = async (): Promise<User | null> => {
  const config = getDefaultConfig();
  const client = getSupabaseClient(config);
  const { data } = await client.auth.getUser();
  return data.user;
};
