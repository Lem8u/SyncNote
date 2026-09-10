import React, { useState } from "react";
import {
  Plus,
  Search,
  Pin,
  Trash2,
  Folder,
  FileText,
  Clock,
  Sparkles,
  ChevronRight,
  ChevronDown,
  User as UserIcon,
  LogIn,
  X,
} from "lucide-react";
import { Note } from "../../types/note";
import { User } from "@supabase/supabase-js";

interface SidebarProps {
  isOpen: boolean;
  notes: Note[];
  selectedNoteId: string | null;
  user: User | null;
  onSelectNote: (noteId: string) => void;
  onCreateNote: () => void;
  onDeleteNote: (e: React.MouseEvent, noteId: string) => void;
  onTogglePinNote: (e: React.MouseEvent, noteId: string) => void;
  onOpenAuthModal: () => void;
  onCloseSidebar?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  notes,
  selectedNoteId,
  user,
  onSelectNote,
  onCreateNote,
  onDeleteNote,
  onTogglePinNote,
  onOpenAuthModal,
  onCloseSidebar,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categoriesExpanded, setCategoriesExpanded] = useState(true);

  const categories = [
    { id: "all", label: "All Notes", icon: FileText },
    { id: "pinned", label: "Pinned", icon: Pin },
    { id: "personal", label: "Personal", icon: Folder },
    { id: "work", label: "Work", icon: Folder },
  ];

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedCategory === "pinned") return !!note.isPinned;
    if (selectedCategory !== "all") return note.category === selectedCategory;
    return true;
  });

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const handleNoteClick = (noteId: string) => {
    onSelectNote(noteId);
    if (typeof window !== "undefined" && window.innerWidth < 768 && onCloseSidebar) {
      onCloseSidebar();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onCloseSidebar}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Sidebar Drawer / Permanent Panel */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 md:static md:z-auto
          w-72 h-full shrink-0 flex flex-col bg-sidebar border-r border-subtle select-none text-main
          shadow-2xl md:shadow-none transition-transform duration-200 ease-out
          ${isOpen ? "translate-x-0" : "-translate-x-full md:hidden"}
        `}
      >
        {/* Top Action & Search Bar */}
        <div className="p-3 space-y-2 border-b border-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Notebooks & Notes
            </span>
            <div className="flex items-center space-x-1">
              <button
                onClick={onCreateNote}
                className="flex items-center space-x-1 px-2.5 py-1 bg-sky-500 hover:bg-sky-400 text-black text-xs font-semibold rounded-md shadow transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Note</span>
              </button>
              {/* Mobile Close Drawer Button */}
              {onCloseSidebar && (
                <button
                  onClick={onCloseSidebar}
                  title="Close sidebar"
                  className="p-1 rounded-md hover:bg-surface-hover text-muted hover:text-main md:hidden transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-subtle" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="w-full pl-8 pr-3 py-1.5 bg-input hover:bg-surface-alt focus:bg-surface text-xs text-main placeholder-subtle rounded-md border border-subtle focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>
        </div>

        {/* Notebook Category Filters */}
        <div className="px-2 py-2 border-b border-subtle">
          <button
            onClick={() => setCategoriesExpanded(!categoriesExpanded)}
            className="w-full flex items-center justify-between px-2 py-1 text-xs text-muted hover:text-main transition-colors cursor-pointer"
          >
            <span className="font-semibold uppercase tracking-wider text-[10px]">Categories</span>
            {categoriesExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>

          {categoriesExpanded && (
            <div className="mt-1 space-y-0.5">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isCatActive = selectedCategory === cat.id;
                const count =
                  cat.id === "all"
                    ? notes.length
                    : cat.id === "pinned"
                    ? notes.filter((n) => n.isPinned).length
                    : notes.filter((n) => n.category === cat.id).length;

                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer ${
                      isCatActive
                        ? "bg-surface-alt text-main font-medium border border-subtle"
                        : "text-muted hover:bg-surface-hover hover:text-main"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className={`w-3.5 h-3.5 ${isCatActive ? "text-sky-400" : "text-muted"}`} />
                      <span>{cat.label}</span>
                    </div>
                    <span className="text-[10px] text-subtle bg-surface-alt px-1.5 py-0.5 rounded">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-8 text-subtle text-xs">
              <p>No notes found</p>
            </div>
          ) : (
            filteredNotes.map((note) => {
              const isSelected = note.id === selectedNoteId;
              return (
                <div
                  key={note.id}
                  onClick={() => handleNoteClick(note.id)}
                  className={`group relative p-2.5 rounded-lg cursor-pointer transition-all border ${
                    isSelected
                      ? "bg-surface border-sky-500/40 text-main shadow-sm"
                      : "bg-surface-alt hover:bg-surface border-transparent hover:border-subtle text-muted hover:text-main"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <h4 className="text-xs font-semibold truncate flex-1 pr-2 text-main">
                      {note.title || "Untitled Note"}
                    </h4>
                    {note.isPinned && (
                      <Pin className="w-3 h-3 text-sky-400 fill-sky-400/20 shrink-0" />
                    )}
                  </div>

                  <p className="text-[11px] text-subtle truncate mt-1 line-clamp-1">
                    {note.content.trim() ? note.content.slice(0, 70) : "No text content"}
                  </p>

                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-subtle text-[10px] text-subtle">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{formatTimestamp(note.updatedAt)}</span>
                    </span>

                    {/* Actions on hover */}
                    <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition-opacity">
                      <button
                        onClick={(e) => onTogglePinNote(e, note.id)}
                        title={note.isPinned ? "Unpin note" : "Pin note"}
                        className="p-1 rounded hover:bg-surface-hover text-muted hover:text-main"
                      >
                        <Pin className="w-2.5 h-2.5" />
                      </button>
                      <button
                        onClick={(e) => onDeleteNote(e, note.id)}
                        title="Delete note"
                        className="p-1 rounded hover:bg-red-500/20 text-muted hover:text-red-400"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom User / Sync Status Card */}
        <div className="p-3 border-t border-subtle bg-sidebar text-[11px] text-muted">
          {user ? (
            <div
              onClick={onOpenAuthModal}
              className="flex items-center justify-between cursor-pointer hover:bg-surface-hover p-1.5 rounded-md transition-colors"
            >
              <div className="flex items-center space-x-2 truncate">
                <div className="w-5 h-5 rounded-full bg-sky-500 flex items-center justify-center text-[10px] text-black font-bold shrink-0">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <div className="truncate">
                  <div className="text-main text-xs font-medium truncate">{user.email}</div>
                  <div className="text-[10px] text-emerald-500 font-medium">Cloud Sync Active</div>
                </div>
              </div>
              <Sparkles className="w-3 h-3 text-sky-400 shrink-0" />
            </div>
          ) : (
            <div
              onClick={onOpenAuthModal}
              className="flex items-center justify-between cursor-pointer hover:bg-surface-hover p-1.5 rounded-md transition-colors"
            >
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 rounded-full bg-surface-alt border border-subtle flex items-center justify-center text-muted shrink-0">
                  <UserIcon className="w-3 h-3" />
                </div>
                <div>
                  <div className="text-main text-xs font-medium">Local Mode</div>
                  <div className="text-[10px] text-subtle">Catatan offline aktif</div>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenAuthModal();
                }}
                className="flex items-center space-x-1 px-2 py-0.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 rounded text-[10px] font-semibold border border-sky-500/30 transition-colors cursor-pointer"
              >
                <LogIn className="w-2.5 h-2.5" />
                <span>Sign In</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
