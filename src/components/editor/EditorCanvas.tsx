import React, { useRef, useEffect } from "react";
import { Note, EditorSettings } from "../../types/note";
import { Sparkles, Calendar, Tag } from "lucide-react";

interface EditorCanvasProps {
  note: Note | null;
  settings: EditorSettings;
  onChangeTitle: (title: string) => void;
  onChangeContent: (content: string) => void;
  onChangeCategory: (category: string) => void;
  onCursorChange: (line: number, column: number, selectionLength: number) => void;
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  note,
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
      <div className="flex-1 flex flex-col items-center justify-center bg-[#202020] text-neutral-400 p-8 select-none">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4 text-sky-400">
          <Sparkles className="w-8 h-8" />
        </div>
        <h3 className="text-base font-semibold text-neutral-200">No Note Selected</h3>
        <p className="text-xs text-neutral-400 mt-1 max-w-sm text-center">
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
    <div className="flex-1 flex flex-col bg-[#202020] overflow-hidden">
      {/* Note Header / Meta info */}
      <div className="px-8 pt-6 pb-2 border-b border-white/[0.04] bg-[#202020]">
        <div className="flex items-center space-x-3 mb-2">
          {/* Category Selector */}
          <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-xs text-neutral-300">
            <Tag className="w-3 h-3 text-sky-400" />
            <select
              value={note.category || "personal"}
              onChange={(e) => onChangeCategory(e.target.value)}
              className="bg-transparent border-none text-xs text-neutral-300 focus:outline-none cursor-pointer"
            >
              <option value="personal" className="bg-[#2a2a2a] text-white">
                Personal
              </option>
              <option value="work" className="bg-[#2a2a2a] text-white">
                Work
              </option>
              <option value="ideas" className="bg-[#2a2a2a] text-white">
                Ideas
              </option>
            </select>
          </div>

          <span className="flex items-center space-x-1 text-[11px] text-neutral-400 font-mono">
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
          className="w-full bg-transparent text-2xl font-bold text-white placeholder-neutral-600 focus:outline-none border-none tracking-tight"
        />
      </div>

      {/* Main Text Canvas */}
      <div className="flex-1 relative flex overflow-hidden">
        <textarea
          ref={textareaRef}
          value={note.content}
          onChange={(e) => onChangeContent(e.target.value)}
          onKeyUp={handleTextareaSelect}
          onClick={handleTextareaSelect}
          onSelect={handleTextareaSelect}
          placeholder="Start typing your note here..."
          spellCheck={settings.spellCheck}
          wrap={settings.wordWrap ? "soft" : "off"}
          style={{
            fontSize: `${settings.fontSize * (settings.zoomLevel / 100)}px`,
            lineHeight: "1.65",
          }}
          className={`w-full h-full p-8 bg-transparent text-neutral-100 placeholder-neutral-600 resize-none focus:outline-none border-none ${fontClass} leading-relaxed selection:bg-sky-500/30 overflow-y-auto`}
        />
      </div>
    </div>
  );
};

