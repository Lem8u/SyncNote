import React from "react";
import { Plus, X, FileText } from "lucide-react";
import { TabItem } from "../../types/note";

interface TabBarProps {
  tabs: TabItem[];
  activeTabId: string | null;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (e: React.MouseEvent, tabId: string) => void;
  onNewTab: () => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
}) => {
  return (
    <div className="flex items-center h-9 px-2 bg-[#202020] border-b border-white/[0.08] overflow-x-auto select-none no-scrollbar">
      <div className="flex items-center space-x-1 flex-1 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`group relative flex items-center h-8 min-w-[120px] max-w-[200px] px-3 space-x-2 rounded-t-md text-xs cursor-pointer transition-all ${
                isActive
                  ? "bg-[#2b2b2b] text-white border-t-2 border-sky-400 font-medium shadow-sm"
                  : "bg-transparent text-neutral-400 hover:bg-white/[0.04] hover:text-neutral-200"
              }`}
            >
              <FileText
                className={`w-3.5 h-3.5 shrink-0 ${
                  isActive ? "text-sky-400" : "text-neutral-400"
                }`}
              />
              <span className="truncate flex-1">
                {tab.title || "Untitled"}
              </span>

              {tab.isDirty && (
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
              )}

              <button
                onClick={(e) => onCloseTab(e, tab.id)}
                title="Close tab"
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/[0.15] text-neutral-400 hover:text-white transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        {/* New Tab Button */}
        <button
          onClick={onNewTab}
          title="New Note Tab (Ctrl+N)"
          className="flex items-center justify-center h-7 w-7 rounded-md hover:bg-white/[0.08] text-neutral-400 hover:text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

