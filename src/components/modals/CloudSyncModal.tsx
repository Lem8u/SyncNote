import React, { useState, useEffect } from "react";
import {
  X,
  Cloud,
  Key,
  Globe,
  Radio,
  CheckCircle2,
  AlertCircle,
  Users,
  LogOut,
  LogIn,
  UserPlus,
  Zap,
} from "lucide-react";
import { SupabaseConfig, SyncStatus } from "../../types/auth";
import {
  getDefaultConfig,
  saveConfig,
  signInWithEmail,
  signUpWithEmail,
  signOut,
  getCurrentUser,
} from "../../lib/supabase";
import { User } from "@supabase/supabase-js";

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncStatus: SyncStatus;
  onlinePeers: number;
  onConfigSaved: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  syncStatus,
  onlinePeers,
  onConfigSaved,
}) => {
  const [config, setConfig] = useState<SupabaseConfig>(getDefaultConfig());
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setConfig(getDefaultConfig());
      getCurrentUser().then(setUser);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveConfig(config);
    onConfigSaved();
    setAuthMessage({ type: "success", text: "Configuration saved & reconnected!" });
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthMessage(null);

    try {
      if (authMode === "signin") {
        const loggedUser = await signInWithEmail(email, password);
        setUser(loggedUser);
        setAuthMessage({ type: "success", text: "Successfully signed in!" });
      } else {
        const newUser = await signUpWithEmail(email, password);
        setUser(newUser);
        setAuthMessage({
          type: "success",
          text: "Registration submitted! Check email or proceed.",
        });
      }
    } catch (err: any) {
      setAuthMessage({ type: "error", text: err.message || "Authentication failed" });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    setAuthMessage({ type: "success", text: "Signed out successfully." });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm select-none p-4">
      <div className="w-full max-w-lg bg-[#242424] border border-white/[0.1] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] bg-[#2a2a2a]/60">
          <div className="flex items-center space-x-2 text-sm font-semibold text-white">
            <Cloud className="w-4 h-4 text-sky-400" />
            <span>Supabase Cloud Sync & Auth</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-white/[0.1] text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-5 overflow-y-auto text-xs text-neutral-300">
          {/* Live Sync Diagnostics Card */}
          <div className="p-4 rounded-lg bg-[#1a1a1a] border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-200 uppercase tracking-wider text-[10px]">
                Real-Time Channel Status
              </span>
              <div
                className={`flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono border ${
                  syncStatus === "synced"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : syncStatus === "syncing"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse"
                    : "bg-neutral-500/10 text-neutral-400 border-neutral-500/20"
                }`}
              >
                <Radio className="w-3 h-3" />
                <span className="capitalize">{syncStatus}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded bg-white/[0.03] border border-white/[0.04] flex items-center space-x-2">
                <Users className="w-4 h-4 text-sky-400" />
                <div>
                  <div className="font-semibold text-white">{onlinePeers} Device(s)</div>
                  <div className="text-[10px] text-neutral-500">Active Presence</div>
                </div>
              </div>

              <div className="p-2.5 rounded bg-white/[0.03] border border-white/[0.04] flex items-center space-x-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="font-semibold text-white">CRDT Merging</div>
                  <div className="text-[10px] text-neutral-500">Conflict-Free (Yjs)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Feedback message */}
          {authMessage && (
            <div
              className={`p-3 rounded-md flex items-center space-x-2 text-xs border ${
                authMessage.type === "success"
                  ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                  : "bg-red-500/10 text-red-300 border-red-500/20"
              }`}
            >
              {authMessage.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{authMessage.text}</span>
            </div>
          )}

          {/* Section 1: Supabase Credentials & Workspace */}
          <form onSubmit={handleSaveConfig} className="space-y-3">
            <span className="font-semibold text-neutral-200 uppercase tracking-wider text-[10px] block">
              1. Supabase Project Settings
            </span>

            <div>
              <label className="block text-[11px] text-neutral-400 mb-1 flex items-center space-x-1">
                <Globe className="w-3 h-3 text-neutral-500" />
                <span>Supabase Project URL</span>
              </label>
              <input
                type="text"
                value={config.url}
                onChange={(e) => setConfig({ ...config, url: e.target.value })}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-3 py-1.5 bg-[#1b1b1b] border border-white/[0.08] rounded text-white text-xs placeholder-neutral-600 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] text-neutral-400 mb-1 flex items-center space-x-1">
                <Key className="w-3 h-3 text-neutral-500" />
                <span>Supabase Anon Public Key</span>
              </label>
              <input
                type="password"
                value={config.anonKey}
                onChange={(e) => setConfig({ ...config, anonKey: e.target.value })}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3 py-1.5 bg-[#1b1b1b] border border-white/[0.08] rounded text-white text-xs placeholder-neutral-600 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] text-neutral-400 mb-1 flex items-center space-x-1">
                <Radio className="w-3 h-3 text-neutral-500" />
                <span>Sync Room / Workspace Channel ID</span>
              </label>
              <input
                type="text"
                value={config.workspaceId}
                onChange={(e) => setConfig({ ...config, workspaceId: e.target.value })}
                placeholder="my-personal-notes"
                className="w-full px-3 py-1.5 bg-[#1b1b1b] border border-white/[0.08] rounded text-white text-xs placeholder-neutral-600 focus:outline-none focus:border-sky-500 font-mono"
              />
              <p className="text-[10px] text-neutral-500 mt-1">
                Devices sharing the same Workspace ID will automatically sync in real-time.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-1.5 bg-white/[0.08] hover:bg-white/[0.12] text-white font-medium text-xs rounded border border-white/[0.1] transition-colors"
            >
              Save Credentials & Reconnect Provider
            </button>
          </form>

          {/* Section 2: User Authentication */}
          <div className="pt-3 border-t border-white/[0.08] space-y-3">
            <span className="font-semibold text-neutral-200 uppercase tracking-wider text-[10px] block">
              2. User Authentication (Optional)
            </span>

            {user ? (
              <div className="p-3 rounded bg-white/[0.04] border border-white/[0.06] flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">{user.email}</div>
                  <div className="text-[10px] text-neutral-500 font-mono">ID: {user.id.slice(0, 8)}...</div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-1 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-xs transition-colors"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleAuth} className="space-y-2.5">
                <div className="flex space-x-2 bg-[#1b1b1b] p-1 rounded border border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setAuthMode("signin")}
                    className={`flex-1 py-1 rounded text-xs font-medium transition-colors ${
                      authMode === "signin"
                        ? "bg-sky-500 text-black shadow-sm"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode("signup")}
                    className={`flex-1 py-1 rounded text-xs font-medium transition-colors ${
                      authMode === "signup"
                        ? "bg-sky-500 text-black shadow-sm"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    Register
                  </button>
                </div>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3 py-1.5 bg-[#1b1b1b] border border-white/[0.08] rounded text-white text-xs placeholder-neutral-600 focus:outline-none focus:border-sky-500"
                />

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-3 py-1.5 bg-[#1b1b1b] border border-white/[0.08] rounded text-white text-xs placeholder-neutral-600 focus:outline-none focus:border-sky-500"
                />

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full flex items-center justify-center space-x-1.5 py-1.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-black font-medium text-xs rounded transition-colors"
                >
                  {authMode === "signin" ? (
                    <LogIn className="w-3.5 h-3.5" />
                  ) : (
                    <UserPlus className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {authLoading
                      ? "Processing..."
                      : authMode === "signin"
                      ? "Sign In with Supabase"
                      : "Create Account"}
                  </span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/[0.06] bg-[#202020] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white/[0.08] hover:bg-white/[0.12] text-white font-medium text-xs rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

