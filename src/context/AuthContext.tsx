import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, Session, AuthChangeEvent } from "@supabase/supabase-js";
import {
  getSupabaseClient,
  getDefaultConfig,
  saveConfig,
  signInWithGoogle as supabaseSignInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  signOut as supabaseSignOut,
} from "../lib/supabase";
import { SupabaseConfig } from "../types/auth";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isGuest: boolean;
  config: SupabaseConfig;
  updateConfig: (newConfig: SupabaseConfig) => void;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<User | null>;
  registerWithEmail: (email: string, password: string) => Promise<User | null>;
  continueAsGuest: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const GUEST_STORAGE_KEY = "syncnote_is_guest";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<SupabaseConfig>(getDefaultConfig());
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  // Local-First: Default to guest/local mode so the app is immediately usable without account
  const [isGuest, setIsGuest] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Clean OAuth tokens or error params from URL once handled
  const cleanUrlTokens = () => {
    if (typeof window !== "undefined") {
      if (
        window.location.hash.includes("access_token") ||
        window.location.hash.includes("error") ||
        window.location.search.includes("code=") ||
        window.location.search.includes("error=")
      ) {
        window.history.replaceState(null, document.title, window.location.pathname);
      }
    }
  };

  // Robust extraction of syncnote:// URL from command-line arguments or payloads
  const extractSyncnoteUrl = (arg: string): string | null => {
    if (typeof arg !== "string") return null;
    const trimmed = arg.replace(/^["']|["']$/g, "").trim();
    const match = trimmed.match(/syncnote:\/\/[^\s"']+/i);
    return match ? match[0] : null;
  };

  // Handle deep link OAuth callback (syncnote://auth/callback#... or ?code=...)
  const handleAuthCallbackUrl = useCallback(async (rawUrl: string) => {
    try {
      console.log("[Auth] Handling OAuth deep link URL:", rawUrl);
      const client = getSupabaseClient(config);
      if (!client) {
        console.warn("[Auth] Supabase client is not configured yet.");
        return;
      }
      setIsLoading(true);

      // Normalize custom scheme so standard URL API can parse it cleanly
      // e.g. syncnote://auth/callback?code=xyz -> https://syncnote.app/auth/callback?code=xyz
      const normalizedUrl = rawUrl.replace(/^syncnote:\/\//i, "https://syncnote.app/");
      const parsed = new URL(normalizedUrl);

      // 1. Check for OAuth errors in query or hash
      const hashStr = parsed.hash.startsWith("#") ? parsed.hash.slice(1) : parsed.hash;
      const hashParams = new URLSearchParams(hashStr);
      const queryParams = parsed.searchParams;

      const error = queryParams.get("error") || hashParams.get("error");
      const errorDescription = queryParams.get("error_description") || hashParams.get("error_description");

      if (error) {
        console.error("[Auth] OAuth callback error:", error, errorDescription);
        setIsLoading(false);
        return;
      }

      // 2. PKCE Flow (code parameter in search or hash)
      const code = queryParams.get("code") || hashParams.get("code");
      if (code) {
        console.log("[Auth] Exchanging PKCE code for session...");
        const { data, error: exchangeError } = await client.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          console.error("[Auth] exchangeCodeForSession failed:", exchangeError);
        } else if (data.session) {
          setSession(data.session);
          setUser(data.session.user);
          setIsGuest(false);
          localStorage.removeItem(GUEST_STORAGE_KEY);
          console.log("[Auth] Successfully authenticated via PKCE deep link!");
        }
        setIsLoading(false);
        return;
      }

      // 3. Implicit Grant Flow (access_token & refresh_token in hash)
      const accessToken = hashParams.get("access_token") || queryParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token") || queryParams.get("refresh_token");

      if (accessToken && refreshToken) {
        console.log("[Auth] Setting session from token grant...");
        const { data, error: tokenError } = await client.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (tokenError) {
          console.error("[Auth] setSession failed:", tokenError);
        } else if (data.session) {
          setSession(data.session);
          setUser(data.session.user);
          setIsGuest(false);
          localStorage.removeItem(GUEST_STORAGE_KEY);
          console.log("[Auth] Successfully authenticated via token deep link!");
        }
        setIsLoading(false);
        return;
      }

      console.warn("[Auth] No OAuth code or tokens found in deep link URL:", rawUrl);
      setIsLoading(false);
    } catch (err: any) {
      console.error("[Auth] Failed to process callback URL:", err);
      setIsLoading(false);
    }
  }, [config]);

  // Deep Link listener for Tauri desktop app
  useEffect(() => {
    const isTauri =
      typeof window !== "undefined" &&
      ((window as any).__TAURI_INTERNALS__ !== undefined ||
        window.location.origin.includes("tauri.localhost") ||
        window.location.protocol === "tauri:");

    if (!isTauri) return;

    let unlistenUrls: (() => void) | undefined;
    let unlistenSingleInstance: (() => void) | undefined;

    const setupListeners = async () => {
      try {
        const { onOpenUrl, getCurrent, isRegistered, register } = await import("@tauri-apps/plugin-deep-link");
        const { listen } = await import("@tauri-apps/api/event");

        // A. Ensure 'syncnote' scheme is registered in Windows OS Registry
        try {
          const registered = await isRegistered("syncnote");
          console.log("[Auth] Deep-link scheme 'syncnote' registered status:", registered);
          if (!registered) {
            console.log("[Auth] Registering 'syncnote' protocol in OS registry...");
            await register("syncnote");
            console.log("[Auth] 'syncnote' protocol successfully registered.");
          }
        } catch (regErr) {
          console.warn("[Auth] Could not check/register deep link scheme in frontend:", regErr);
        }

        // B. Check initial URLs if app was launched via deep link
        try {
          const initialUrls = await getCurrent();
          console.log("[Auth] Initial deep link URLs on startup:", initialUrls);
          if (initialUrls && initialUrls.length > 0) {
            for (const u of initialUrls) {
              const clean = extractSyncnoteUrl(u);
              if (clean) {
                await handleAuthCallbackUrl(clean);
              }
            }
          }
        } catch (initErr) {
          console.warn("[Auth] Error reading initial deep link URLs:", initErr);
        }

        // C. Listen for deep-link events from plugin-deep-link
        try {
          unlistenUrls = await onOpenUrl(async (urls) => {
            console.log("[Auth] onOpenUrl event received:", urls);
            for (const u of urls) {
              const clean = extractSyncnoteUrl(u);
              if (clean) {
                await handleAuthCallbackUrl(clean);
              }
            }
          });
        } catch (openUrlErr) {
          console.warn("[Auth] Error registering onOpenUrl listener:", openUrlErr);
        }

        // D. Listen for single-instance event forwarded from Rust
        try {
          unlistenSingleInstance = await listen<string[]>("deep-link://new-url", async (event) => {
            console.log("[Auth] single-instance event received:", event.payload);
            const args = event.payload;
            if (Array.isArray(args)) {
              for (const arg of args) {
                const clean = extractSyncnoteUrl(arg);
                if (clean) {
                  await handleAuthCallbackUrl(clean);
                }
              }
            }
          });
        } catch (singleInstanceErr) {
          console.warn("[Auth] Error registering single-instance listener:", singleInstanceErr);
        }
      } catch (e) {
        console.warn("[Auth] Deep link setup encountered error:", e);
      }
    };

    setupListeners();

    return () => {
      if (unlistenUrls) unlistenUrls();
      if (unlistenSingleInstance) unlistenSingleInstance();
    };
  }, [handleAuthCallbackUrl]);
  useEffect(() => {
    // Check if there is any persisted Supabase session in localStorage or an OAuth redirect callback
    const hasStoredAuth =
      typeof window !== "undefined" &&
      (Object.keys(localStorage).some(
        (k) => k.startsWith("sb-") && k.endsWith("-auth-token")
      ) ||
        window.location.hash.includes("access_token") ||
        window.location.search.includes("code="));

    if (!hasStoredAuth) {
      // Pure Local Mode: Do not initialize Supabase on startup. Keep local mode 100% standalone.
      console.log("[Auth] Pure Local Mode active. Supabase initialization deferred.");
      console.timeLog("startup", "Auth checked");
      setIsLoading(false);
      return;
    }

    const client = getSupabaseClient(config);
    if (!client) {
      console.timeLog("startup", "Auth checked");
      setIsLoading(false);
      return;
    }

    // Check for OAuth errors in URL on mount
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      const search = window.location.search;
      if (hash.includes("error=") || search.includes("error=")) {
        console.error("[Auth] OAuth error returned in URL:", hash || search);
        cleanUrlTokens();
        setIsLoading(false);
      }
    }

    // 1. Fetch current persisted session
    client.auth
      .getSession()
      .then(({ data, error }: { data: { session: Session | null }; error: unknown }) => {
        console.timeLog("startup", "Auth checked");
        if (!error && data.session) {
          setSession(data.session);
          setUser(data.session.user);
          setIsGuest(false);
          localStorage.removeItem(GUEST_STORAGE_KEY);
          cleanUrlTokens();
        }
        setIsLoading(false);
      })
      .catch(() => {
        console.timeLog("startup", "Auth checked");
        setIsLoading(false);
      });

    // 2. Real-time auth state listener
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event: AuthChangeEvent, newSession: Session | null) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession) {
        setIsGuest(false);
        localStorage.removeItem(GUEST_STORAGE_KEY);
        cleanUrlTokens();
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [config]);

  const updateConfig = useCallback((newConfig: SupabaseConfig) => {
    saveConfig(newConfig);
    setConfig(newConfig);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    await supabaseSignInWithGoogle();
  }, []);

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    const loggedUser = await signInWithEmail(email, password);
    setUser(loggedUser);
    setIsGuest(false);
    localStorage.removeItem(GUEST_STORAGE_KEY);
    return loggedUser;
  }, []);

  const registerWithEmail = useCallback(async (email: string, password: string) => {
    const newUser = await signUpWithEmail(email, password);
    setUser(newUser);
    setIsGuest(false);
    localStorage.removeItem(GUEST_STORAGE_KEY);
    return newUser;
  }, []);

  const continueAsGuest = useCallback(() => {
    setIsGuest(true);
    localStorage.setItem(GUEST_STORAGE_KEY, "true");
  }, []);

  const logout = useCallback(async () => {
    await supabaseSignOut();
    setUser(null);
    setSession(null);
    setIsGuest(false);
    localStorage.removeItem(GUEST_STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isGuest,
        config,
        updateConfig,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        continueAsGuest,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
