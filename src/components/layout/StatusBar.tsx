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
    <footer className="h-7 shrink-0 flex items-center justify-between px-3 bg-[#1c1c1c] border-t border-white/[0.06] text-[11px] text-neutral-400 select-none font-mono">
      {/* Left Info: Cursor & Word/Char Count & Local DB Status */}
      <div className="flex items-center space-x-3">
        <span className="hover:text-neutral-200 transition-colors cursor-default">
          Ln {cursorLine}, Col {cursorColumn}
        </span>
        <span className="text-white/10">|</span>
        <span className="hover:text-neutral-200 transition-colors cursor-default">
          {characterCount} chars, {wordCount} words
        </span>
        <span className="text-white/10">|</span>
        <span
          className="flex items-center space-x-1 text-emerald-400/90 text-[10px]"
          title="IndexedDB Local-First Storage Active"
        >
          <HardDrive className="w-3 h-3" />
          <span>{isLocalSynced ? "IndexedDB Ready" : "Initializing..."}</span>
        </span>
      </div>

      {/* Right Info: Zoom, Encoding, Platform */}
      <div className="flex items-center space-x-4">
        {/* Zoom Controls */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onZoomChange(-10)}
            title="Zoom Out"
            className="p-0.5 rounded hover:bg-white/[0.08] hover:text-white"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <button
            onClick={onResetZoom}
            title="Reset Zoom (Ctrl+0)"
            className="px-1 py-0.5 rounded hover:bg-white/[0.08] hover:text-white"
          >
            {zoomLevel}%
          </button>
          <button
            onClick={() => onZoomChange(10)}
            title="Zoom In"
            className="p-0.5 rounded hover:bg-white/[0.08] hover:text-white"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>

        <span className="text-white/10">|</span>
        <span className="hover:text-neutral-200 transition-colors cursor-default">
          Windows (CRLF)
        </span>
        <span className="text-white/10">|</span>
        <span className="hover:text-neutral-200 transition-colors cursor-default">
          UTF-8
        </span>
      </div>
    </footer>
  );
};
