import React, { useState } from "react";
import { LogOut, HardDrive, ShieldAlert, CheckCircle2, X } from "lucide-react";
import { User } from "@supabase/supabase-js";

interface LogoutDialogProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onConfirm: (options: { removeSyncedWorkspace: boolean }) => void;
  isLoading?: boolean;
}

export const LogoutDialog: React.FC<LogoutDialogProps> = ({
  isOpen,
  user,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const [selectedOption, setSelectedOption] = useState<"keep" | "remove">("keep");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm select-none p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-surface border border-subtle rounded-xl shadow-2xl overflow-hidden flex flex-col transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-subtle bg-header transition-colors">
          <div className="flex items-center space-x-2 text-sm font-semibold text-main">
            <LogOut className="w-4 h-4 text-amber-400" />
            <span>Sign Out</span>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-md hover:bg-surface-hover text-muted hover:text-main transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs text-muted">
          <p className="text-main font-medium">
            You are currently signed in as <span className="text-sky-400">{user?.email || "User"}</span>.
          </p>
          <p className="text-subtle">
            Please choose how you want SyncNote to handle notes currently loaded on this device:
          </p>

          {/* Option 1: Keep local notes */}
          <div
            onClick={() => setSelectedOption("keep")}
            className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start space-x-3 ${
              selectedOption === "keep"
                ? "bg-sky-500/10 border-sky-500 text-main"
                : "bg-surface-alt border-subtle hover:border-strong text-muted"
            }`}
          >
            <div className={`p-2 rounded-md ${selectedOption === "keep" ? "bg-sky-500 text-black" : "bg-surface text-muted"}`}>
              <HardDrive className="w-4 h-4" />
            </div>
            <div className="flex-1 space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-main text-xs">Keep local notes</span>
                {selectedOption === "keep" && <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />}
              </div>
              <p className="text-[11px] text-subtle leading-relaxed">
                Disconnect cloud sync and keep notes accessible offline in Local Mode on this device.
              </p>
            </div>
          </div>

          {/* Option 2: Remove synced workspace */}
          <div
            onClick={() => setSelectedOption("remove")}
            className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start space-x-3 ${
              selectedOption === "remove"
                ? "bg-rose-500/10 border-rose-500 text-main"
                : "bg-surface-alt border-subtle hover:border-strong text-muted"
            }`}
          >
            <div className={`p-2 rounded-md ${selectedOption === "remove" ? "bg-rose-500 text-white" : "bg-surface text-muted"}`}>
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="flex-1 space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-main text-xs">Remove synced workspace</span>
                {selectedOption === "remove" && <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />}
              </div>
              <p className="text-[11px] text-subtle leading-relaxed">
                Clean local cache of this account and reset to a fresh workspace. Recommended on shared devices to prevent data leakage.
              </p>
            </div>
          </div>

          <p className="text-[10px] text-subtle italic">
            * Your notes backed up to the cloud remain completely safe and intact in Supabase.
          </p>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-subtle bg-header flex items-center justify-end space-x-2">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-3.5 py-1.5 rounded-md hover:bg-surface-hover text-muted hover:text-main text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm({ removeSyncedWorkspace: selectedOption === "remove" })}
            disabled={isLoading}
            className={`px-4 py-1.5 font-medium text-xs rounded-md transition-colors cursor-pointer flex items-center space-x-1.5 ${
              selectedOption === "remove"
                ? "bg-rose-600 hover:bg-rose-500 text-white"
                : "bg-sky-500 hover:bg-sky-400 text-black"
            }`}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isLoading ? "Signing Out..." : "Sign Out"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

