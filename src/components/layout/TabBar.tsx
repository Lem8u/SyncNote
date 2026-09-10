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
    <div className="flex items-center h-9 px-2 bg-header border-b border-subtle overflow-x-auto select-none no-scrollbar transition-colors">
      <div className="flex items-center space-x-1 flex-1 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`group relative flex items-center h-8 min-w-[100px] sm:min-w-[120px] max-w-[180px] sm:max-w-[200px] px-2.5 sm:px-3 space-x-2 rounded-t-md text-xs cursor-pointer transition-all ${
                isActive
                  ? "bg-surface text-main border-t-2 border-sky-400 font-medium shadow-xs"
                  : "bg-transparent text-muted hover:bg-surface-hover hover:text-main"
              }`}
            >
              <FileText
                className={`w-3.5 h-3.5 shrink-0 ${
                  isActive ? "text-sky-400" : "text-subtle"
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
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-surface-hover text-muted hover:text-main transition-opacity"
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
          className="p-1.5 rounded-md hover:bg-surface-hover text-muted hover:text-main transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
