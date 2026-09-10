import React, { useRef, useEffect } from "react";
import { Note, EditorSettings } from "../../types/note";
import { Sparkles, Calendar, Tag } from "lucide-react";

interface EditorCanvasProps {
  note: Note | null;
  isLocalSynced?: boolean;
  settings: EditorSettings;
  onChangeTitle: (title: string) => void;
  onChangeContent: (content: string) => void;
  onChangeCategory: (category: string) => void;
  onCursorChange: (line: number, column: number, selectionLength: number) => void;
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  note,
  isLocalSynced: _isLocalSynced = true,
  settings,
  onChangeTitle,
  onChangeContent,
  onChangeCategory,
  onCursorChange,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    // Focus textarea on note switch
    if (note && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [note?.id]);

  const handleTextareaSelect = () => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const textBeforeCursor = el.value.substring(0, el.selectionStart);
    const lines = textBeforeCursor.split("\n");
    const lineNumber = lines.length;
    const columnNumber = lines[lines.length - 1].length + 1;
    const selectionLength = Math.abs(el.selectionEnd - el.selectionStart);
    onCursorChange(lineNumber, columnNumber, selectionLength);
  };

  if (!note) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-app text-muted p-8 select-none animate-in fade-in duration-150 transition-colors">
        <div className="w-16 h-16 rounded-2xl bg-surface border border-subtle flex items-center justify-center mb-4 text-sky-400 shadow-xs">
          <Sparkles className="w-8 h-8" />
        </div>
        <h3 className="text-base font-semibold text-main">No Note Selected</h3>
        <p className="text-xs text-subtle mt-1 max-w-sm text-center">
          Create a new note or select one from the sidebar to start writing.
        </p>
      </div>
    );
  }

  const fontClass =
    settings.fontFamily === "Cascadia Code"
      ? "font-mono font-normal"
      : settings.fontFamily === "Consolas"
      ? "font-mono"
      : "font-sans";

  return (
    <div className="flex-1 flex flex-col bg-app overflow-hidden transition-colors">
      {/* Note Header / Meta info */}
      <div className="px-4 sm:px-8 pt-4 sm:pt-6 pb-2 border-b border-subtle bg-app transition-colors">
        <div className="flex items-center space-x-3 mb-2 flex-wrap gap-y-1">
          {/* Category Selector */}
          <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-surface border border-subtle text-xs text-main">
            <Tag className="w-3 h-3 text-sky-400" />
            <select
              value={note.category || "personal"}
              onChange={(e) => onChangeCategory(e.target.value)}
              className="bg-transparent border-none text-xs text-main focus:outline-none cursor-pointer"
            >
              <option value="personal" className="bg-surface text-main">
                Personal
              </option>
              <option value="work" className="bg-surface text-main">
                Work
              </option>
              <option value="ideas" className="bg-surface text-main">
                Ideas
              </option>
            </select>
          </div>

          <span className="flex items-center space-x-1 text-[11px] text-subtle font-mono">
            <Calendar className="w-3 h-3" />
            <span>
              Updated {new Date(note.updatedAt).toLocaleDateString()}{" "}
              {new Date(note.updatedAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </span>
        </div>

        {/* Note Title Input */}
        <input
          type="text"
          value={note.title}
          onChange={(e) => onChangeTitle(e.target.value)}
          placeholder="Untitled Note"
          className="w-full text-xl sm:text-2xl font-bold bg-transparent text-main placeholder-subtle border-none focus:outline-none tracking-tight transition-colors"
        />
      </div>

      {/* Editor Main Canvas Textarea */}
      <div className="flex-1 relative overflow-hidden bg-app">
        <textarea
          ref={textareaRef}
          value={note.content}
          onChange={(e) => onChangeContent(e.target.value)}
          onSelect={handleTextareaSelect}
          onKeyUp={handleTextareaSelect}
          onClick={handleTextareaSelect}
          placeholder="Start typing your note here... (Markdown supported)"
          spellCheck={settings.spellCheck}
          wrap={settings.wordWrap ? "soft" : "off"}
          style={{
            fontSize: `${(settings.fontSize * (settings.zoomLevel || 100)) / 100}px`,
            lineHeight: "1.65",
          }}
          className={`w-full h-full p-4 sm:p-8 bg-transparent text-main placeholder-subtle resize-none border-none focus:outline-none ${fontClass} leading-relaxed selection:bg-sky-500/30 overflow-y-auto`}
        />
      </div>
    </div>
  );
};
