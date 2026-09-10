import React from "react";
import { X, Type, AlignLeft, ShieldCheck, Sparkles, Sun, Moon, Monitor } from "lucide-react";
import { EditorSettings } from "../../types/note";
import { useTheme, ThemeMode } from "../../context/ThemeContext";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: EditorSettings;
  onUpdateSettings: (newSettings: Partial<EditorSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const { theme, setTheme } = useTheme();

  if (!isOpen) return null;

  const themeOptions: { id: ThemeMode; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: "dark", label: "Dark", icon: Moon },
    { id: "light", label: "Light", icon: Sun },
    { id: "system", label: "System", icon: Monitor },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm select-none p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-surface border border-subtle rounded-xl shadow-2xl overflow-hidden flex flex-col transition-colors">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-subtle bg-header transition-colors">
          <div className="flex items-center space-x-2 text-sm font-semibold text-main">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>Settings</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-surface-hover text-muted hover:text-main transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-5 space-y-5 text-xs text-muted max-h-[80vh] overflow-y-auto">
          {/* Appearance / Theme */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-main font-medium">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Appearance</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {themeOptions.map((opt) => {
                const Icon = opt.icon;
                const isActive = theme === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setTheme(opt.id)}
                    className={`py-2 px-3 rounded-lg border text-center flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                      isActive
                        ? "bg-sky-500/15 border-sky-500 text-sky-400 font-medium"
                        : "bg-surface-alt border-subtle text-muted hover:border-strong hover:text-main"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Font Family */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-main font-medium">
              <Type className="w-3.5 h-3.5 text-sky-400" />
              <span>Font Family</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(["Segoe UI", "Cascadia Code", "Consolas"] as const).map((font) => (
                <button
                  key={font}
                  onClick={() => onUpdateSettings({ fontFamily: font })}
                  className={`py-2 px-3 rounded-lg border text-center transition-all cursor-pointer ${
                    settings.fontFamily === font
                      ? "bg-sky-500/15 border-sky-500 text-sky-400 font-medium"
                      : "bg-surface-alt border-subtle text-muted hover:border-strong hover:text-main"
                  }`}
                >
                  {font}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-main font-medium">Font Size</span>
              <p className="text-[10px] text-subtle">Editor text scaling</p>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="12"
                max="28"
                step="1"
                value={settings.fontSize}
                onChange={(e) =>
                  onUpdateSettings({ fontSize: parseInt(e.target.value, 10) })
                }
                className="w-24 accent-sky-500 cursor-pointer"
              />
              <span className="font-mono text-xs text-muted w-6 text-right">
                {settings.fontSize}px
              </span>
            </div>
          </div>

          {/* Word Wrap Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlignLeft className="w-3.5 h-3.5 text-muted" />
              <div>
                <span className="text-main font-medium">Word Wrap</span>
                <p className="text-[10px] text-subtle">Wrap long lines to canvas</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.wordWrap}
              onChange={(e) => onUpdateSettings({ wordWrap: e.target.checked })}
              className="w-4 h-4 rounded accent-sky-500 cursor-pointer"
            />
          </div>

          {/* Architecture info */}
          <div className="p-3 rounded-lg bg-surface-alt border border-subtle space-y-1">
            <div className="flex items-center space-x-2 text-main font-medium text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Local-First & CRDT Architecture</span>
            </div>
            <p className="text-[10px] text-subtle leading-relaxed">
              SyncNote stores everything in local IndexedDB first with zero latency.
              When network is connected, changes merge automatically with Yjs CRDTs.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-subtle bg-header flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-sky-500 hover:bg-sky-400 text-black font-medium text-xs rounded-md transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
