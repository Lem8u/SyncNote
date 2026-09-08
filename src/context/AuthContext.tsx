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
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    return localStorage.getItem(GUEST_STORAGE_KEY) === "true";
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize auth state and listen for session changes
  useEffect(() => {
    const client = getSupabaseClient(config);
    if (!client) {
      setIsLoading(false);
      return;
    }

    // 1. Fetch current persisted session
    client.auth.getSession().then(({ data, error }: { data: { session: Session | null }; error: unknown }) => {
      if (!error && data.session) {
        setSession(data.session);
        setUser(data.session.user);
        setIsGuest(false);
        localStorage.removeItem(GUEST_STORAGE_KEY);
      }
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
    });

    // 2. Real-time auth state listener
    const { data: { subscription } } = client.auth.onAuthStateChange((_event: AuthChangeEvent, newSession: Session | null) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession) {
        setIsGuest(false);
        localStorage.removeItem(GUEST_STORAGE_KEY);
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
