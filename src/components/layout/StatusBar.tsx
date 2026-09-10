import React from "react";
import { ZoomIn, ZoomOut, HardDrive } from "lucide-react";

interface StatusBarProps {
  cursorLine: number;
  cursorColumn: number;
  characterCount: number;
  wordCount: number;
  zoomLevel: number;
  isLocalSynced: boolean;
  onZoomChange: (delta: number) => void;
  onResetZoom: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  cursorLine,
  cursorColumn,
  characterCount,
  wordCount,
  zoomLevel,
  isLocalSynced,
  onZoomChange,
  onResetZoom,
}) => {
  return (
    <footer className="h-7 shrink-0 flex items-center justify-between px-3 bg-header border-t border-subtle text-[11px] text-muted select-none font-mono transition-colors">
      {/* Left Info: Cursor & Word/Char Count & Local DB Status */}
      <div className="flex items-center space-x-2 sm:space-x-3 truncate">
        <span className="hover:text-main transition-colors cursor-default">
          Ln {cursorLine}, Col {cursorColumn}
        </span>
        <span className="text-subtle/40 hidden xs:inline">|</span>
        <span className="hover:text-main transition-colors cursor-default hidden sm:inline">
          {characterCount} chars, {wordCount} words
        </span>
        <span className="text-subtle/40">|</span>
        <span
          className="flex items-center space-x-1 text-emerald-500 font-medium text-[10px]"
          title="Local-First Storage Active"
        >
          <HardDrive className="w-3 h-3" />
          <span className="hidden xs:inline">{isLocalSynced ? "Local Ready" : "Initializing..."}</span>
        </span>
      </div>

      {/* Right Info: Zoom, Encoding, Platform */}
      <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
        {/* Zoom Controls */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onZoomChange(-10)}
            title="Zoom Out"
            className="p-0.5 rounded hover:bg-surface-hover hover:text-main transition-colors cursor-pointer"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <button
            onClick={onResetZoom}
            title="Reset Zoom (Ctrl+0)"
            className="px-1 py-0.5 rounded hover:bg-surface-hover hover:text-main transition-colors cursor-pointer"
          >
            {zoomLevel}%
          </button>
          <button
            onClick={() => onZoomChange(10)}
            title="Zoom In"
            className="p-0.5 rounded hover:bg-surface-hover hover:text-main transition-colors cursor-pointer"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>

        <span className="text-subtle/40 hidden md:inline">|</span>
        <span className="hidden md:inline hover:text-main transition-colors cursor-default">
          UTF-8
        </span>

        <span className="text-subtle/40 hidden md:inline">|</span>
        <span className="hidden md:inline hover:text-main transition-colors cursor-default">
          Windows (CRLF)
        </span>
      </div>
    </footer>
  );
};
