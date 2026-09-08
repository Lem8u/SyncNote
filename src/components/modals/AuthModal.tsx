import React, { useState } from "react";
import {
  X,
  LogIn,
  LogOut,
  Mail,
  Lock,
  Globe,
  Key,
  Shield,
  CheckCircle2,
  AlertCircle,
  Laptop,
  Smartphone,
  Check,
  Radio,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const {
    user,
    config,
    updateConfig,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    logout,
  } = useAuth();

  const [tab, setTab] = useState<"auth" | "config">("auth");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Config form state
  const [url, setUrl] = useState(config.url);
  const [anonKey, setAnonKey] = useState(config.anonKey);
  const [workspaceId, setWorkspaceId] = useState(config.workspaceId);

  if (!isOpen) return null;

  const handleGoogleAuth = async () => {
    if (!config.url || !config.anonKey) {
      setMessage({
        type: "error",
        text: "Please configure your Supabase Project URL & Anon Key first in the 'Backend Config' tab.",
      });
      setTab("config");
      return;
    }

    setGoogleLoading(true);
    setMessage(null);

    try {
      await loginWithGoogle();
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Failed to start Google login. Check Supabase Google provider settings.",
      });
      setGoogleLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config.url || !config.anonKey) {
      setMessage({
        type: "error",
        text: "Please configure your Supabase Project URL & Anon Key first in the 'Backend Config' tab.",
      });
      setTab("config");
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      if (authMode === "signin") {
        await loginWithEmail(email, password);
        setMessage({ type: "success", text: "Signed in successfully! Notes are now synced." });
      } else {
        await registerWithEmail(email, password);
        setMessage({
          type: "success",
          text: "Registration successful! You can now use your account across devices.",
        });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Authentication failed. Please check credentials." });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig({ url, anonKey, workspaceId });
    setMessage({ type: "success", text: "Supabase configuration updated!" });
  };

  const handleLogout = async () => {
    await logout();
    setMessage({ type: "success", text: "Signed out. You are now in local guest mode." });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md select-none p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#242424] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#2a2a2a]/60">
          <div className="flex items-center space-x-2.5 text-sm font-semibold text-white">
            <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Shield className="w-4 h-4" />
            </div>
            <span>{user ? "Your Account & Sync" : "Sign In to SyncNote"}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-white/[0.1] text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch (Auth vs Backend Settings) */}
        <div className="flex border-b border-white/[0.06] bg-[#1d1d1d] px-6 pt-2">
          <button
            onClick={() => setTab("auth")}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-all cursor-pointer ${
              tab === "auth"
                ? "border-sky-400 text-white font-semibold"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            {user ? "Account Profile" : "Login & Register"}
          </button>
          <button
            onClick={() => setTab("config")}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-all cursor-pointer ${
              tab === "config"
                ? "border-sky-400 text-white font-semibold"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Supabase Backend
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs text-neutral-300">
          {/* Notification feedback */}
          {message && (
            <div
              className={`p-3 rounded-lg flex items-center space-x-2 text-xs border ${
                message.type === "success"
                  ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                  : "bg-red-500/10 text-red-300 border-red-500/20"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {tab === "auth" ? (
            user ? (
              /* Logged In View */
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-bold text-base shadow">
                      {user.email?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="text-sm font-semibold text-white truncate">{user.email}</div>
                      <div className="text-[10px] text-emerald-400 flex items-center space-x-1 mt-0.5">
                        <Check className="w-3 h-3" />
                        <span>Real-Time Sync Active across all your devices</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/[0.04] text-[11px] text-neutral-400 space-y-1">
                    <div className="flex justify-between">
                      <span>User ID:</span>
                      <span className="font-mono text-neutral-300">{user.id.slice(0, 12)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sync Channel:</span>
                      <span className="font-mono text-sky-400">user-{user.id.slice(0, 8)}</span>
                    </div>
                  </div>
                </div>

                {/* Multi-Device instruction card */}
                <div className="p-3 rounded-lg bg-[#1a1a1a] border border-white/[0.06] space-y-2">
                  <div className="font-medium text-white text-[11px] flex items-center space-x-1.5">
                    <Laptop className="w-3.5 h-3.5 text-sky-400" />
                    <span>+</span>
                    <Smartphone className="w-3.5 h-3.5 text-sky-400" />
                    <span>Connect other devices</span>
                  </div>
                  <p className="text-[10px] text-neutral-400 leading-relaxed">
                    Log in with <strong className="text-neutral-200">{user.email}</strong> on your MacBook or Android phone to instantly sync your notes in real-time.
                  </p>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 py-2 bg-red-500/15 hover:bg-red-500/25 text-red-300 font-medium text-xs rounded-lg border border-red-500/20 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out of SyncNote</span>
                </button>
              </div>
            ) : (
              /* Login / Register Form */
              <div className="space-y-4">
                {/* Google OAuth Button */}
                <button
                  onClick={handleGoogleAuth}
                  disabled={googleLoading}
                  className="w-full h-10 flex items-center justify-center space-x-3 bg-white hover:bg-neutral-100 text-neutral-900 font-semibold text-xs rounded-xl shadow transition-all cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>{googleLoading ? "Connecting..." : "Continue with Google"}</span>
                </button>

                <div className="flex items-center space-x-2">
                  <div className="flex-1 h-[1px] bg-white/[0.08]" />
                  <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
                    or
                  </span>
                  <div className="flex-1 h-[1px] bg-white/[0.08]" />
                </div>

                <form onSubmit={handleAuthSubmit} className="space-y-3">
                  <div className="flex space-x-1 bg-[#181818] p-1 rounded-lg border border-white/[0.06]">
                    <button
                      type="button"
                      onClick={() => setAuthMode("signin")}
                      className={`flex-1 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                        authMode === "signin"
                          ? "bg-sky-500 text-black shadow font-semibold"
                          : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMode("signup")}
                      className={`flex-1 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                        authMode === "signup"
                          ? "bg-sky-500 text-black shadow font-semibold"
                          : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      Create Account
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] text-neutral-400 flex items-center space-x-1">
                      <Mail className="w-3 h-3 text-neutral-500" />
                      <span>Email Address</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/[0.08] rounded-lg text-white text-xs placeholder-neutral-600 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] text-neutral-400 flex items-center space-x-1">
                      <Lock className="w-3 h-3 text-neutral-500" />
                      <span>Password</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/[0.08] rounded-lg text-white text-xs placeholder-neutral-600 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center space-x-2 py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-black font-semibold text-xs rounded-lg shadow transition-all cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>
                      {loading
                        ? "Connecting..."
                        : authMode === "signin"
                        ? "Sign In & Sync Notes"
                        : "Create Account & Sync"}
                    </span>
                  </button>
                </form>
              </div>
            )
          ) : (
            /* Backend Config Form */
            <form onSubmit={handleSaveConfig} className="space-y-3.5">
              <div className="space-y-1">
                <label className="block text-[11px] text-neutral-400 flex items-center space-x-1">
                  <Globe className="w-3 h-3 text-neutral-500" />
                  <span>Supabase Project URL</span>
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/[0.08] rounded-lg text-white text-xs placeholder-neutral-600 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] text-neutral-400 flex items-center space-x-1">
                  <Key className="w-3 h-3 text-neutral-500" />
                  <span>Supabase Anon Public Key</span>
                </label>
                <input
                  type="password"
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/[0.08] rounded-lg text-white text-xs placeholder-neutral-600 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] text-neutral-400 flex items-center space-x-1">
                  <Radio className="w-3 h-3 text-neutral-500" />
                  <span>Default Workspace Room ID</span>
                </label>
                <input
                  type="text"
                  value={workspaceId}
                  onChange={(e) => setWorkspaceId(e.target.value)}
                  placeholder="my-workspace"
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/[0.08] rounded-lg text-white text-xs placeholder-neutral-600 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-white/[0.08] hover:bg-white/[0.12] text-white font-medium text-xs rounded-lg border border-white/[0.1] transition-colors cursor-pointer"
              >
                Save Backend Configuration
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/[0.06] bg-[#202020] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white/[0.08] hover:bg-white/[0.12] text-white font-medium text-xs rounded-md transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

