import React from "react";
import { X, Type, AlignLeft, ShieldCheck, Sparkles } from "lucide-react";
import { EditorSettings } from "../../types/note";

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm select-none p-4">
      <div className="w-full max-w-md bg-[#252525] border border-white/[0.1] rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] bg-[#2a2a2a]/60">
          <div className="flex items-center space-x-2 text-sm font-semibold text-white">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>Settings</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-white/[0.1] text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-5 space-y-5 text-xs text-neutral-300">
          {/* Font Family */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-neutral-200 font-medium">
              <Type className="w-3.5 h-3.5 text-sky-400" />
              <span>Font Family</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(["Segoe UI", "Cascadia Code", "Consolas"] as const).map((font) => (
                <button
                  key={font}
                  onClick={() => onUpdateSettings({ fontFamily: font })}
                  className={`py-2 px-3 rounded-lg border text-center transition-all ${
                    settings.fontFamily === font
                      ? "bg-sky-500/20 border-sky-500 text-sky-300 font-medium"
                      : "bg-[#1f1f1f] border-white/[0.06] text-neutral-400 hover:border-white/[0.2]"
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
              <span className="text-neutral-200 font-medium">Font Size</span>
              <p className="text-[10px] text-neutral-500">Editor text scaling</p>
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
              <span className="font-mono text-xs text-neutral-300 w-6 text-right">
                {settings.fontSize}px
              </span>
            </div>
          </div>

          {/* Word Wrap Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlignLeft className="w-3.5 h-3.5 text-neutral-400" />
              <div>
                <span className="text-neutral-200 font-medium">Word Wrap</span>
                <p className="text-[10px] text-neutral-500">Wrap long lines to canvas</p>
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
          <div className="p-3 rounded-lg bg-[#1e1e1e] border border-white/[0.06] space-y-1">
            <div className="flex items-center space-x-2 text-neutral-200 font-medium text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Local-First & CRDT Architecture</span>
            </div>
            <p className="text-[10px] text-neutral-400 leading-relaxed">
              SyncNote stores everything in local IndexedDB first with zero latency.
              When network is connected, changes merge automatically with Yjs CRDTs.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/[0.06] bg-[#222222] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-sky-500 hover:bg-sky-400 text-black font-medium text-xs rounded-md transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

