import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import * as Y from "yjs";
import { IndexeddbPersistence } from "y-indexeddb";
import { Note } from "../types/note";
import { SupabaseYjsProvider } from "../lib/y-supabase-provider";
import { getSupabaseClient } from "../lib/supabase";
import { SyncStatus } from "../types/auth";
import { useAuth } from "./AuthContext";

interface NotesContextType {
  notes: Note[];
  isLocalSynced: boolean;
  cloudSyncStatus: SyncStatus;
  onlinePeers: number;
  createNote: (title?: string, content?: string, category?: string) => string;
  updateNoteTitle: (id: string, title: string) => void;
  updateNoteContent: (id: string, content: string) => void;
  updateNoteCategory: (id: string, category: string) => void;
  togglePinNote: (id: string) => void;
  deleteNote: (id: string) => void;
  reconnectCloudSync: () => void;
}

const NotesContext = createContext<NotesContextType | null>(null);

const DEFAULT_WELCOME_NOTE: Note = {
  id: "welcome-note",
  title: "Welcome to SyncNote 📝",
  content: `# Welcome to SyncNote!

SyncNote is an offline-first, Windows 11 Fluent notepad with real-time CRDT multi-device synchronization.

## 🚀 How Multi-Device Sync Works:
1. **Sign In / Login**: Click "Sign In" at the top-right to log in with your account.
2. **Open on MacBook & Android**: Log in with the same account on your other devices.
3. **Instant Sync**: Everything you type merges seamlessly in real-time across your devices without merge conflicts!

Try editing this note or creating a new one!`,
  category: "personal",
  createdAt: Date.now(),
  updatedAt: Date.now(),
  isPinned: true,
};

export const NotesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, config } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLocalSynced, setIsLocalSynced] = useState<boolean>(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<SyncStatus>("offline");
  const [onlinePeers, setOnlinePeers] = useState<number>(1);

  // Yjs doc reference & providers
  const ydocRef = useRef<Y.Doc>(new Y.Doc());
  const idbProviderRef = useRef<IndexeddbPersistence | null>(null);
  const supabaseProviderRef = useRef<SupabaseYjsProvider | null>(null);

  // Sync React state from Yjs Map
  const refreshNotesFromYDoc = useCallback(() => {
    const doc = ydocRef.current;
    const notesMap = doc.getMap<any>("notes");
    const result: Note[] = [];

    notesMap.forEach((val, id) => {
      if (val) {
        if (typeof val.toJSON === "function") {
          result.push(val.toJSON() as Note);
        } else {
          result.push({ ...val, id });
        }
      }
    });

    // Sort by pinned first, then updatedAt descending
    result.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });

    setNotes(result);
  }, []);

  // Connect to Supabase Cloud Sync (ONLY for authenticated users)
  const connectCloudSync = useCallback(() => {
    // Local-first: If user is not authenticated, strictly stay in local offline mode
    if (!user) {
      if (supabaseProviderRef.current) {
        supabaseProviderRef.current.disconnect();
      }
      setCloudSyncStatus("offline");
      setOnlinePeers(1);
      return;
    }

    const client = getSupabaseClient(config);
    if (client && supabaseProviderRef.current) {
      // User is logged in: sync via their private workspace channel
      const activeWorkspaceId = `user-${user.id}`;
      supabaseProviderRef.current.connect(client, activeWorkspaceId);
    } else if (!client && supabaseProviderRef.current) {
      supabaseProviderRef.current.disconnect();
    }
  }, [user, config]);

  useEffect(() => {
    console.log("[Startup] begin");
    console.time("workspace-init");
    console.log("[Startup] Yjs init");
    console.timeLog("startup", "Yjs ready");

    const doc = ydocRef.current;
    const notesMap = doc.getMap<any>("notes");

    // Immediately seed in-memory default note if storage has not been populated yet
    // This guarantees the UI has notes immediately in 0ms and never gets stuck
    if (notesMap.size === 0) {
      doc.transact(() => {
        const noteMap = new Y.Map();
        noteMap.set("id", DEFAULT_WELCOME_NOTE.id);
        noteMap.set("title", DEFAULT_WELCOME_NOTE.title);
        noteMap.set("content", DEFAULT_WELCOME_NOTE.content);
        noteMap.set("category", DEFAULT_WELCOME_NOTE.category);
        noteMap.set("createdAt", DEFAULT_WELCOME_NOTE.createdAt);
        noteMap.set("updatedAt", DEFAULT_WELCOME_NOTE.updatedAt);
        noteMap.set("isPinned", DEFAULT_WELCOME_NOTE.isPinned);
        notesMap.set(DEFAULT_WELCOME_NOTE.id, noteMap);
      });
    }
    refreshNotesFromYDoc();

    console.log("[Startup] IndexedDB init");
    let hasResolved = false;

    const finalizeWorkspaceReady = () => {
      if (hasResolved) return;
      hasResolved = true;
      setIsLocalSynced(true);
      refreshNotesFromYDoc();

      console.log("[Startup] workspace ready");
      console.timeLog("startup", "Database initialized");
      try {
        console.timeEnd("workspace-init");
      } catch (e) {}

      try {
        performance.mark("workspace-ready");
        performance.measure("react-to-workspace", "react-mounted", "workspace-ready");
        const mWorkspace = performance.getEntriesByName("react-to-workspace")[0];
        if (mWorkspace) {
          console.log(`[Startup Profiling] React mounted → local workspace ready: ${mWorkspace.duration.toFixed(2)} ms`);
        }
        performance.measure("total-startup", "syncnote-start", "workspace-ready");
        const mTotal = performance.getEntriesByName("total-startup")[0];
        if (mTotal) {
          console.log(`[Startup Profiling] Total startup (WebView start → workspace ready): ${mTotal.duration.toFixed(2)} ms`);
        }
      } catch (e) {}
    };

    // 1. Initialize IndexedDB local-first persistence
    let idbProvider: IndexeddbPersistence | null = null;

    try {
      idbProvider = new IndexeddbPersistence("syncnote_storage_v1", doc);
      idbProviderRef.current = idbProvider;

      // Check if provider is already synced
      if (idbProvider.synced) {
        finalizeWorkspaceReady();
      }

      // Event listener for sync completion
      idbProvider.on("synced", () => {
        finalizeWorkspaceReady();
      });

      // Promise resolution
      idbProvider.whenSynced
        .then(() => {
          finalizeWorkspaceReady();
        })
        .catch((err) => {
          console.error("[Startup] IndexedDB whenSynced failed:", err);
          finalizeWorkspaceReady();
        });
    } catch (err) {
      console.error("[Startup] Failed to create IndexeddbPersistence:", err);
      finalizeWorkspaceReady();
    }

    // Safety net fallback timeout (3s) to guarantee no infinite hang
    const safetyTimer = setTimeout(() => {
      if (!hasResolved) {
        console.warn("[Startup] IndexedDB initialization safety timeout (3s) reached. Continuing in Local Mode.");
        finalizeWorkspaceReady();
      }
    }, 3000);

    // 2. Initialize Supabase Realtime Provider
    const spProvider = new SupabaseYjsProvider(doc, {
      onStatusChange: (status) => setCloudSyncStatus(status),
      onPeersChange: (peers) => setOnlinePeers(peers),
    });
    supabaseProviderRef.current = spProvider;

    // 3. Listen for deep changes on notesMap (local or remote Yjs updates)
    const observer = () => {
      refreshNotesFromYDoc();
    };
    notesMap.observeDeep(observer);

    return () => {
      clearTimeout(safetyTimer);
      notesMap.unobserveDeep(observer);
      if (idbProvider) {
        idbProvider.destroy();
      }
      spProvider.destroy();
    };
  }, [refreshNotesFromYDoc]);

  // Re-connect cloud sync whenever user or supabase config changes
  useEffect(() => {
    connectCloudSync();
  }, [connectCloudSync]);

  // CRUD Operations
  const createNote = useCallback((title = "Untitled Note", content = "", category = "personal"): string => {
    const doc = ydocRef.current;
    const notesMap = doc.getMap<any>("notes");
    const id = `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = Date.now();

    doc.transact(() => {
      const noteMap = new Y.Map();
      noteMap.set("id", id);
      noteMap.set("title", title);
      noteMap.set("content", content);
      noteMap.set("category", category);
      noteMap.set("createdAt", now);
      noteMap.set("updatedAt", now);
      noteMap.set("isPinned", false);
      notesMap.set(id, noteMap);
    });

    refreshNotesFromYDoc();
    return id;
  }, [refreshNotesFromYDoc]);

  const updateNoteTitle = useCallback((id: string, title: string) => {
    const doc = ydocRef.current;
    const notesMap = doc.getMap<any>("notes");
    const noteMap = notesMap.get(id);

    if (noteMap) {
      doc.transact(() => {
        if (typeof noteMap.set === "function") {
          noteMap.set("title", title);
          noteMap.set("updatedAt", Date.now());
        }
      });
      refreshNotesFromYDoc();
    }
  }, [refreshNotesFromYDoc]);

  const updateNoteContent = useCallback((id: string, content: string) => {
    const doc = ydocRef.current;
    const notesMap = doc.getMap<any>("notes");
    const noteMap = notesMap.get(id);

    if (noteMap) {
      doc.transact(() => {
        if (typeof noteMap.set === "function") {
          noteMap.set("content", content);
          noteMap.set("updatedAt", Date.now());
        }
      });
      refreshNotesFromYDoc();
    }
  }, [refreshNotesFromYDoc]);

  const updateNoteCategory = useCallback((id: string, category: string) => {
    const doc = ydocRef.current;
    const notesMap = doc.getMap<any>("notes");
    const noteMap = notesMap.get(id);

    if (noteMap) {
      doc.transact(() => {
        if (typeof noteMap.set === "function") {
          noteMap.set("category", category);
          noteMap.set("updatedAt", Date.now());
        }
      });
      refreshNotesFromYDoc();
    }
  }, [refreshNotesFromYDoc]);

  const togglePinNote = useCallback((id: string) => {
    const doc = ydocRef.current;
    const notesMap = doc.getMap<any>("notes");
    const noteMap = notesMap.get(id);

    if (noteMap) {
      doc.transact(() => {
        if (typeof noteMap.get === "function" && typeof noteMap.set === "function") {
          const currentPinned = !!noteMap.get("isPinned");
          noteMap.set("isPinned", !currentPinned);
        }
      });
      refreshNotesFromYDoc();
    }
  }, [refreshNotesFromYDoc]);

  const deleteNote = useCallback((id: string) => {
    const doc = ydocRef.current;
    const notesMap = doc.getMap<any>("notes");

    doc.transact(() => {
      notesMap.delete(id);
    });
    refreshNotesFromYDoc();
  }, [refreshNotesFromYDoc]);

  return (
    <NotesContext.Provider
      value={{
        notes,
        isLocalSynced,
        cloudSyncStatus,
        onlinePeers,
        createNote,
        updateNoteTitle,
        updateNoteContent,
        updateNoteCategory,
        togglePinNote,
        deleteNote,
        reconnectCloudSync: connectCloudSync,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
};

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error("useNotes must be used within a NotesProvider");
  }
  return context;
};
