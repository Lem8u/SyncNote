import React, { useState } from "react";
import { FileText, AlertCircle, CheckCircle2, HelpCircle } from "lucide-react";
import { signInWithGoogle } from "../../lib/supabase";

export const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setMessage(null);

    try {
      await signInWithGoogle();
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Gagal menghubungi Supabase. Pastikan file .env sudah diisi dengan benar.",
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-[#191919] text-[#f3f3f3] p-4 select-none font-sans relative overflow-hidden">
      {/* Windows 11 Mica Subtle Backlight Blur */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Centered Login Card */}
      <div className="w-full max-w-[400px] bg-[#232323]/95 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-2xl p-8 space-y-6 z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* App Branding */}
        <div className="flex flex-col items-center text-center space-y-2.5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-sky-400 to-blue-600 p-[1px] shadow-lg shadow-sky-500/20">
            <div className="w-full h-full bg-[#1c1c1c] rounded-2xl flex items-center justify-center">
              <FileText className="w-7 h-7 text-sky-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">SyncNote</h1>
          <p className="text-xs text-neutral-400 max-w-xs leading-relaxed">
            Windows 11 Notepad with real-time multi-device synchronization.
          </p>
        </div>

        {/* Feedback Alert */}
        {message && (
          <div
            className={`p-3.5 rounded-xl flex items-start space-x-2.5 text-xs border ${
              message.type === "success"
                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                : "bg-red-500/10 text-red-300 border-red-500/20"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            )}
            <div className="space-y-1">
              <p className="leading-relaxed font-medium">{message.text}</p>
              {message.type === "error" && (
                <p className="text-[11px] text-neutral-400">
                  Dapatkan URL & Anon Key di: <strong>Supabase Dashboard &rarr; Project Settings &rarr; API</strong>, lalu restart terminal <code className="text-sky-400">npm run dev</code>.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Google Login Button */}
        <div className="pt-2">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full h-12 flex items-center justify-center space-x-3 bg-white hover:bg-neutral-100 active:bg-neutral-200 text-neutral-900 font-semibold text-sm rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
          >
            {/* Google Logo SVG */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            <span>{loading ? "Redirecting to Google..." : "Login with Google"}</span>
          </button>
        </div>

        {/* Small Helper hint */}
        <div className="pt-2 flex items-center justify-center space-x-1.5 text-[11px] text-neutral-500">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Konfigurasi Supabase diambil dari file <code className="text-neutral-400">.env</code></span>
        </div>
      </div>
    </div>
  );
};

export default Login;
