import React, {
  useState,
  useEffect,
  useMemo,
  Suspense,
  lazy
} from "react";
import { TitleBar } from "./components/layout/TitleBar";
import { TabBar } from "./components/layout/TabBar";
import { Sidebar } from "./components/layout/Sidebar";
import { EditorCanvas } from "./components/editor/EditorCanvas";
import { StatusBar } from "./components/layout/StatusBar";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotesProvider, useNotes } from "./context/NotesContext";
import { TabItem, EditorSettings } from "./types/note";
import { Info, X } from "lucide-react";

// Lazy-load heavy modals to optimize initial startup bundle and rendering speed
const SettingsModal = lazy(() =>
  import("./components/modals/SettingsModal").then((module) => ({
    default: module.SettingsModal,
  }))
);
const AuthModal = lazy(() =>
  import("./components/modals/AuthModal").then((module) => ({
    default: module.AuthModal,
  }))
);

function SyncNoteApp() {
  const { user } = useAuth();
  const {
    notes,
    isLocalSynced,
    storageNotice,
    dismissStorageNotice,
    cloudSyncStatus,
    onlinePeers,
    createNote,
    updateNoteTitle,
    updateNoteContent,
    updateNoteCategory,
    togglePinNote,
    deleteNote,
  } = useNotes();

  const [activeNoteId, setActiveNoteId] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Tab management
  const [tabs, setTabs] = useState<TabItem[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>("");

  // Editor configuration
  const [settings, setSettings] = useState<EditorSettings>({
    fontSize: 14,
    fontFamily: "Segoe UI",
    wordWrap: true,
    spellCheck: false,
    zoomLevel: 100,
  });

  // Cursor & document stats
  const [cursorInfo, setCursorInfo] = useState({
    line: 1,
    column: 1,
    selectionLength: 0,
  });

  // Startup profiling: log when App component mounts and renders to DOM
  useEffect(() => {
    console.timeLog("startup", "App rendered");
  }, []);

  // Auto-select first note when notes load from IndexedDB and no tab is open
  useEffect(() => {
    if (notes.length > 0 && tabs.length === 0) {
      const firstNote = notes[0];
      const initialTab: TabItem = {
        id: `tab-${firstNote.id}`,
        noteId: firstNote.id,
        title: firstNote.title || "Untitled",
      };
      setTabs([initialTab]);
      setActiveTabId(initialTab.id);
      setActiveNoteId(firstNote.id);
    }
  }, [notes, tabs.length]);

  // Keep tab titles in sync when note titles update from remote peers or local edits
  useEffect(() => {
    setTabs((prevTabs) =>
      prevTabs.map((tab) => {
        const correspondingNote = notes.find((n) => n.id === tab.noteId);
        if (correspondingNote && correspondingNote.title !== tab.title) {
          return { ...tab, title: correspondingNote.title || "Untitled" };
        }
        return tab;
      })
    );
  }, [notes]);

  // Active note resolution
  const activeNote = useMemo(() => {
    return notes.find((n) => n.id === activeNoteId) || null;
  }, [notes, activeNoteId]);

  // Document statistics
  const { characterCount, wordCount } = useMemo(() => {
    if (!activeNote) return { characterCount: 0, wordCount: 0 };
    const text = activeNote.content || "";
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    return { characterCount: chars, wordCount: words };
  }, [activeNote]);

  // Handle Note Selection (from sidebar or tabs)
  const handleSelectNote = (noteId: string) => {
    setActiveNoteId(noteId);
    const existingTab = tabs.find((t) => t.noteId === noteId);
    if (existingTab) {
      setActiveTabId(existingTab.id);
    } else {
      const note = notes.find((n) => n.id === noteId);
      const newTab: TabItem = {
        id: `tab-${noteId}-${Date.now()}`,
        noteId,
        title: note ? note.title : "Untitled",
      };
      setTabs((prev) => [...prev, newTab]);
      setActiveTabId(newTab.id);
    }
  };

  // Handle Tab Switch
  const handleSelectTab = (tabId: string) => {
    setActiveTabId(tabId);
    const tab = tabs.find((t) => t.id === tabId);
    if (tab) {
      setActiveNoteId(tab.noteId);
    }
  };

  // Handle Tab Close
  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    const remainingTabs = tabs.filter((t) => t.id !== tabId);
    setTabs(remainingTabs);

    if (activeTabId === tabId) {
      if (remainingTabs.length > 0) {
        const nextTab = remainingTabs[remainingTabs.length - 1];
        setActiveTabId(nextTab.id);
        setActiveNoteId(nextTab.noteId);
      } else {
        setActiveTabId("");
        setActiveNoteId("");
      }
    }
  };

  // Handle New Note Creation (using Yjs)
  const handleCreateNote = () => {
    const newNoteId = createNote("Untitled Note", "", "personal");
    setActiveNoteId(newNoteId);

    const newTab: TabItem = {
      id: `tab-${newNoteId}-${Date.now()}`,
      noteId: newNoteId,
      title: "Untitled Note",
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  // Handle Note Title Update
  const handleChangeTitle = (newTitle: string) => {
    if (!activeNoteId) return;
    updateNoteTitle(activeNoteId, newTitle);
  };

  // Handle Note Content Update
  const handleChangeContent = (newContent: string) => {
    if (!activeNoteId) return;
    updateNoteContent(activeNoteId, newContent);
  };

  // Handle Category Change
  const handleChangeCategory = (category: string) => {
    if (!activeNoteId) return;
    updateNoteCategory(activeNoteId, category);
  };

  // Handle Pin Toggle
  const handleTogglePinNote = (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    togglePinNote(noteId);
  };

  // Handle Delete Note
  const handleDeleteNote = (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    deleteNote(noteId);

    // Close tab if open
    const remainingTabs = tabs.filter((t) => t.noteId !== noteId);
    setTabs(remainingTabs);

    if (activeNoteId === noteId) {
      if (remainingTabs.length > 0) {
        const nextTab = remainingTabs[0];
        setActiveTabId(nextTab.id);
        setActiveNoteId(nextTab.noteId);
      } else {
        setActiveTabId("");
        setActiveNoteId("");
      }
    }
  };

  // Zoom handlers
  const handleZoomChange = (delta: number) => {
    setSettings((prev) => ({
      ...prev,
      zoomLevel: Math.max(50, Math.min(250, prev.zoomLevel + delta)),
    }));
  };

  const handleResetZoom = () => {
    setSettings((prev) => ({ ...prev, zoomLevel: 100 }));
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "n" || e.key === "N") {
          e.preventDefault();
          handleCreateNote();
        } else if (e.key === "\\" || e.key === "b" || e.key === "B") {
          e.preventDefault();
          setSidebarOpen((prev) => !prev);
        } else if (e.key === "0") {
          e.preventDefault();
          handleResetZoom();
        } else if (e.key === "=" || e.key === "+") {
          e.preventDefault();
          handleZoomChange(10);
        } else if (e.key === "-") {
          e.preventDefault();
          handleZoomChange(-10);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <div className="h-screen w-screen flex flex-col bg-[#202020] text-[#f3f3f3] select-none font-sans overflow-hidden">
      {/* 1. Title Bar */}
      <TitleBar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        user={user}
        syncStatus={cloudSyncStatus}
        onlinePeers={onlinePeers}
      />

      {/* Storage Recovery Notice Banner */}
      {storageNotice && (
        <div className="bg-amber-950/70 border-b border-amber-500/30 px-4 py-1.5 flex items-center justify-between text-xs text-amber-200 animate-in fade-in duration-200 z-20">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{storageNotice}</span>
          </div>
          <button
            onClick={dismissStorageNotice}
            className="p-1 hover:bg-white/[0.08] rounded text-amber-300 hover:text-white transition-colors cursor-pointer"
            title="Dismiss notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Top Tab Strip */}
      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onSelectTab={handleSelectTab}
        onCloseTab={handleCloseTab}
        onNewTab={handleCreateNote}
      />

      {/* 3. Main Split View: Sidebar + Editor Canvas */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          isOpen={sidebarOpen}
          notes={notes}
          selectedNoteId={activeNoteId}
          user={user}
          onSelectNote={handleSelectNote}
          onCreateNote={handleCreateNote}
          onDeleteNote={handleDeleteNote}
          onTogglePinNote={handleTogglePinNote}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
        />

        <EditorCanvas
          note={activeNote}
          isLocalSynced={isLocalSynced}
          settings={settings}
          onChangeTitle={handleChangeTitle}
          onChangeContent={handleChangeContent}
          onChangeCategory={handleChangeCategory}
          onCursorChange={(line, column, selectionLength) =>
            setCursorInfo({ line, column, selectionLength })
          }
        />
      </div>

      {/* 4. Windows 11 Status Bar */}
      <StatusBar
        cursorLine={cursorInfo.line}
        cursorColumn={cursorInfo.column}
        characterCount={characterCount}
        wordCount={wordCount}
        zoomLevel={settings.zoomLevel}
        isLocalSynced={isLocalSynced}
        onZoomChange={handleZoomChange}
        onResetZoom={handleResetZoom}
      />

      {/* 5. Modals (Lazy-loaded) */}
      <Suspense fallback={null}>
        {isSettingsOpen && (
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            settings={settings}
            onUpdateSettings={(newSettings) =>
              setSettings((prev) => ({ ...prev, ...newSettings }))
            }
          />
        )}
        {isAuthModalOpen && (
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
          />
        )}
      </Suspense>
    </div>
  );
}

function RootApp() {
  // Local-first: Always mount and render the app immediately without auth gating
  return (
    <NotesProvider>
      <SyncNoteApp />
    </NotesProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RootApp />
    </AuthProvider>
  );
}
