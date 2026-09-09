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

  // Handle deep link OAuth callback (syncnote://auth/callback#... or ?code=...)
  const handleAuthCallbackUrl = useCallback(async (urlStr: string) => {
    try {
      console.log("[Auth] Handling deep link OAuth callback URL:", urlStr);
      const client = getSupabaseClient(config);
      if (!client) return;

      let hashParams: URLSearchParams | null = null;
      let queryParams: URLSearchParams | null = null;

      if (urlStr.includes("#")) {
        const hashPart = urlStr.split("#")[1];
        hashParams = new URLSearchParams(hashPart);
      }
      if (urlStr.includes("?")) {
        const queryPart = urlStr.split("?")[1].split("#")[0];
        queryParams = new URLSearchParams(queryPart);
      }

      // 1. Implicit Grant Flow (access_token in hash)
      const accessToken = hashParams?.get("access_token");
      const refreshToken = hashParams?.get("refresh_token");

      if (accessToken && refreshToken) {
        console.log("[Auth] Setting session from deep link tokens...");
        const { data, error } = await client.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          console.error("[Auth] Error setting session from tokens:", error);
        } else if (data.session) {
          setSession(data.session);
          setUser(data.session.user);
          setIsGuest(false);
          localStorage.removeItem(GUEST_STORAGE_KEY);
          console.log("[Auth] Successfully authenticated via deep link!");
        }
        return;
      }

      // 2. PKCE Flow (code in query)
      const code = queryParams?.get("code");
      if (code) {
        console.log("[Auth] Exchanging PKCE code for session...");
        const { data, error } = await client.auth.exchangeCodeForSession(code);
        if (error) {
          console.error("[Auth] Error exchanging code for session:", error);
        } else if (data.session) {
          setSession(data.session);
          setUser(data.session.user);
          setIsGuest(false);
          localStorage.removeItem(GUEST_STORAGE_KEY);
          console.log("[Auth] Successfully authenticated via PKCE deep link!");
        }
        return;
      }
    } catch (err) {
      console.error("[Auth] Failed to process callback URL:", err);
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
        const { onOpenUrl, getCurrent } = await import("@tauri-apps/plugin-deep-link");
        const { listen } = await import("@tauri-apps/api/event");

        // 1. Check if application was launched directly with a deep link
        const initialUrls = await getCurrent();
        if (initialUrls && initialUrls.length > 0) {
          for (const u of initialUrls) {
            if (u.startsWith("syncnote://")) {
              await handleAuthCallbackUrl(u);
            }
          }
        }

        // 2. Listen for deep link events while running
        unlistenUrls = await onOpenUrl(async (urls) => {
          for (const u of urls) {
            if (u.startsWith("syncnote://")) {
              await handleAuthCallbackUrl(u);
            }
          }
        });

        // 3. Listen for single-instance event forwarded from Rust
        unlistenSingleInstance = await listen<string[]>("deep-link://new-url", async (event) => {
          const args = event.payload;
          if (Array.isArray(args)) {
            for (const arg of args) {
              if (typeof arg === "string" && arg.startsWith("syncnote://")) {
                await handleAuthCallbackUrl(arg);
              }
            }
          }
        });
      } catch (e) {
        console.warn("[Auth] Failed to setup deep link listener:", e);
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
