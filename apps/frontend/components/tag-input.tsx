"use client";

import { useState, useRef, useCallback } from "react";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  saving?: boolean;
}

export function TagInput({ tags, onChange, placeholder = "Type and press Enter to add...", saving }: TagInputProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = useCallback(() => {
    const trimmed = input.trim().replace(/,+$/, "");
    if (!trimmed) return;
    if (tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      setInput("");
      return;
    }
    onChange([...tags, trimmed]);
    setInput("");
  }, [input, tags, onChange]);

  const removeTag = useCallback(
    (idx: number) => {
      onChange(tags.filter((_, i) => i !== idx));
    },
    [tags, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addTag();
      }
      if (e.key === "Backspace" && !input && tags.length > 0) {
        removeTag(tags.length - 1);
      }
    },
    [addTag, removeTag, input, tags.length]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const pasted = e.clipboardData.getData("text");
      if (pasted.includes(",") || pasted.includes("\n")) {
        e.preventDefault();
        const newTags = pasted
          .split(/[,\n]+/)
          .map((t) => t.trim())
          .filter((t) => t.length > 0 && !tags.some((existing) => existing.toLowerCase() === t.toLowerCase()));
        if (newTags.length > 0) {
          onChange([...tags, ...newTags]);
        }
      }
    },
    [tags, onChange]
  );

  return (
    <div className="relative">
      <div
        className="flex min-h-[42px] flex-wrap items-start gap-1.5 rounded border border-zinc-700 bg-zinc-900 px-2 py-2 cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            className="inline-flex items-center gap-1 rounded bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-xs text-amber-300"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(i);
              }}
              className="ml-0.5 text-amber-500 hover:text-red-400 text-[10px]"
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={addTag}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] bg-transparent text-xs text-zinc-200 placeholder-zinc-600 outline-none py-0.5"
          disabled={saving}
        />
      </div>
    </div>
  );
}
