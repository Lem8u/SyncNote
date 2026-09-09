import {
  FileText,
  Settings,
  PanelLeftClose,
  PanelLeft,
  WifiOff,
  CloudCheck,
  Cloud,
  Users,
  User as UserIcon,
  LogIn,
} from "lucide-react";
import { SyncStatus } from "../../types/auth";
import { User } from "@supabase/supabase-js";

interface TitleBarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenSettings: () => void;
  onOpenAuthModal: () => void;
  user: User | null;
  syncStatus?: SyncStatus;
  onlinePeers?: number;
}

export const TitleBar = ({
  sidebarOpen,
  onToggleSidebar,
  onOpenSettings,
  onOpenAuthModal,
  user,
  syncStatus = "offline",
  onlinePeers = 1,
}: TitleBarProps) => {
  return (
    <header className="h-10 shrink-0 flex items-center justify-between px-3 bg-[#1f1f1f] border-b border-white/[0.06] select-none">
      {/* Left: App Brand & Sidebar Toggle */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onToggleSidebar}
          title={sidebarOpen ? "Collapse Sidebar (Ctrl+\\)" : "Expand Sidebar (Ctrl+\\)"}
          className="p-1.5 rounded-md hover:bg-white/[0.08] active:bg-white/[0.05] text-neutral-300 hover:text-white transition-colors cursor-pointer"
        >
          {sidebarOpen ? (
            <PanelLeftClose className="w-4 h-4" />
          ) : (
            <PanelLeft className="w-4 h-4" />
          )}
        </button>

        <div className="flex items-center space-x-2 px-1 text-sm font-medium text-neutral-200">
          <FileText className="w-4 h-4 text-sky-400" />
          <span className="font-semibold tracking-wide">SyncNote</span>
        </div>

        {/* Windows 11 Menu Bar Items */}
        <nav className="hidden md:flex items-center space-x-0.5 ml-2 text-xs text-neutral-300">
          {["File", "Edit", "View"].map((menu) => (
            <button
              key={menu}
              className="px-2.5 py-1 rounded hover:bg-white/[0.08] text-neutral-300 hover:text-white transition-colors"
            >
              {menu}
            </button>
          ))}
        </nav>
      </div>

      {/* Right: User Login, Sync Status & Settings Button */}
      <div className="flex items-center space-x-2">
        {/* Active Peers Counter */}
        {syncStatus === "synced" && onlinePeers > 1 && (
          <div
            title={`${onlinePeers} devices currently connected`}
            className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-mono bg-sky-500/10 text-sky-400 border border-sky-500/20"
          >
            <Users className="w-3 h-3" />
            <span>{onlinePeers} devices</span>
          </div>
        )}

        {/* Sync Status Badge */}
        <button
          onClick={onOpenAuthModal}
          title="Click to view Sync and Account settings"
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-mono border transition-all cursor-pointer ${
            syncStatus === "synced"
              ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20"
              : syncStatus === "syncing"
              ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20 animate-pulse"
              : "bg-neutral-500/10 hover:bg-neutral-500/20 text-neutral-400 border-neutral-500/20"
          }`}
        >
          {syncStatus === "synced" ? (
            <CloudCheck className="w-3.5 h-3.5 text-emerald-400" />
          ) : syncStatus === "syncing" ? (
            <Cloud className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-neutral-400" />
          )}
          <span className="text-[11px] font-sans">
            {syncStatus === "synced"
              ? "Cloud Synced"
              : syncStatus === "syncing"
              ? "Syncing..."
              : "Local Mode"}
          </span>
        </button>

        {/* User Account / Sign In Button */}
        {user ? (
          <button
            onClick={onOpenAuthModal}
            title={`Logged in as ${user.email} (Cloud Sync Active)`}
            className="flex items-center space-x-1.5 px-2.5 py-1 bg-white/[0.06] hover:bg-white/[0.1] text-neutral-200 text-xs rounded-md border border-white/[0.08] transition-colors cursor-pointer"
          >
            <div className="w-4 h-4 rounded-full bg-sky-500 flex items-center justify-center text-[10px] text-black font-bold">
              {user.email?.charAt(0).toUpperCase() || <UserIcon className="w-3 h-3" />}
            </div>
            <span className="max-w-[100px] truncate">{user.email?.split("@")[0]}</span>
          </button>
        ) : (
          <button
            onClick={onOpenAuthModal}
            title="Enable Cloud Sync to sync notes across devices"
            className="flex items-center space-x-1.5 px-2.5 py-1 bg-white/[0.08] hover:bg-white/[0.14] text-neutral-200 text-xs font-medium rounded-md border border-white/[0.1] transition-colors cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5 text-sky-400" />
            <span>Enable Cloud Sync</span>
          </button>
        )}

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          title="App Settings"
          className="p-1.5 rounded-md hover:bg-white/[0.08] text-neutral-300 hover:text-white transition-colors cursor-pointer"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
