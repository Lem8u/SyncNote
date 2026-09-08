export interface Note {
  id: string;
  title: string;
  content: string;
  category?: string;
  createdAt: number;
  updatedAt: number;
  isPinned?: boolean;
}

export interface TabItem {
  id: string;
  noteId: string;
  title: string;
  isDirty?: boolean;
}

export interface EditorSettings {
  fontSize: number;
  fontFamily: "Segoe UI" | "Cascadia Code" | "Consolas";
  wordWrap: boolean;
  spellCheck: boolean;
  zoomLevel: number;
}

