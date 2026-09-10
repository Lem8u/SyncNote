import React from "react";
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

export const TitleBar: React.FC<TitleBarProps> = ({
  sidebarOpen,
  onToggleSidebar,
  onOpenSettings,
  onOpenAuthModal,
  user,
  syncStatus = "offline",
  onlinePeers = 1,
}) => {
  return (
    <header className="h-10 shrink-0 flex items-center justify-between px-3 bg-header border-b border-subtle select-none transition-colors">
      {/* Left: App Brand & Sidebar Toggle */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onToggleSidebar}
          title={sidebarOpen ? "Collapse Sidebar (Ctrl+\\)" : "Expand Sidebar (Ctrl+\\)"}
          className="p-1.5 rounded-md hover:bg-surface-hover active:bg-surface-alt text-muted hover:text-main transition-colors cursor-pointer"
        >
          {sidebarOpen ? (
            <PanelLeftClose className="w-4 h-4" />
          ) : (
            <PanelLeft className="w-4 h-4" />
          )}
        </button>

        <div className="flex items-center space-x-2 px-1 text-sm font-medium text-main">
          <FileText className="w-4 h-4 text-sky-400" />
          <span className="font-semibold tracking-wide">SyncNote</span>
        </div>

        {/* Windows 11 Menu Bar Items (Desktop only) */}
        <nav className="hidden md:flex items-center space-x-0.5 ml-2 text-xs text-muted">
          {["File", "Edit", "View"].map((menu) => (
            <button
              key={menu}
              className="px-2.5 py-1 rounded hover:bg-surface-hover text-muted hover:text-main transition-colors cursor-pointer"
            >
              {menu}
            </button>
          ))}
        </nav>
      </div>

      {/* Right: User Login, Sync Status & Settings Button */}
      <div className="flex items-center space-x-1.5 sm:space-x-2">
        {/* Active Peers Counter (Desktop/Tablet) */}
        {syncStatus === "synced" && onlinePeers > 1 && (
          <div
            title={`${onlinePeers} devices currently connected`}
            className="hidden sm:flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-mono bg-sky-500/10 text-sky-400 border border-sky-500/20"
          >
            <Users className="w-3 h-3" />
            <span>{onlinePeers}</span>
          </div>
        )}

        {/* Sync Status Badge */}
        <button
          onClick={onOpenAuthModal}
          title="Click to view Sync and Account settings"
          className={`flex items-center space-x-1.5 px-2 sm:px-2.5 py-1 rounded-md text-xs font-mono border transition-all cursor-pointer ${
            syncStatus === "synced"
              ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20"
              : syncStatus === "syncing"
              ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20 animate-pulse"
              : "bg-surface-alt hover:bg-surface-hover text-muted border-subtle"
          }`}
        >
          {syncStatus === "synced" ? (
            <CloudCheck className="w-3.5 h-3.5 text-emerald-400" />
          ) : syncStatus === "syncing" ? (
            <Cloud className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-subtle" />
          )}
          <span className="text-[11px] font-sans hidden sm:inline">
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
            className="flex items-center space-x-1.5 px-2 sm:px-2.5 py-1 bg-surface-alt hover:bg-surface-hover text-main text-xs rounded-md border border-subtle transition-colors cursor-pointer"
          >
            <div className="w-4 h-4 rounded-full bg-sky-500 flex items-center justify-center text-[10px] text-black font-bold shrink-0">
              {user.email?.charAt(0).toUpperCase() || <UserIcon className="w-3 h-3" />}
            </div>
            <span className="max-w-[70px] sm:max-w-[110px] truncate hidden xs:inline">
              {user.email?.split("@")[0]}
            </span>
          </button>
        ) : (
          <button
            onClick={onOpenAuthModal}
            title="Enable Cloud Sync to sync notes across devices"
            className="flex items-center space-x-1.5 px-2 sm:px-2.5 py-1 bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 text-xs font-medium rounded-md border border-sky-500/30 transition-colors cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Enable Sync</span>
          </button>
        )}

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          title="App Settings"
          className="p-1.5 rounded-md hover:bg-surface-hover text-muted hover:text-main transition-colors cursor-pointer"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
