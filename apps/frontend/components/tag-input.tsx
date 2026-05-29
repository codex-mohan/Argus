"use client";

import { useCallback, useRef, useState } from "react";

interface TagInputProps {
  onChange: (tags: string[]) => void;
  placeholder?: string;
  saving?: boolean;
  tags: string[];
}

export function TagInput({
  tags,
  onChange,
  placeholder = "Type and press Enter to add...",
  saving,
}: TagInputProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = useCallback(() => {
    const trimmed = input.trim().replace(/,+$/, "");
    if (!trimmed) {
      return;
    }
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
          .filter(
            (t) =>
              t.length > 0 &&
              !tags.some(
                (existing) => existing.toLowerCase() === t.toLowerCase()
              )
          );
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
        className="flex min-h-[42px] cursor-text flex-wrap items-start gap-1.5 rounded border border-zinc-700 bg-zinc-900 px-2 py-2"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag, i) => (
          <span
            className="inline-flex items-center gap-1 rounded border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-amber-300 text-xs"
            key={`${tag}-${i}`}
          >
            {tag}
            <button
              className="ml-0.5 text-[10px] text-amber-500 hover:text-red-400"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(i);
              }}
              type="button"
            >
              ×
            </button>
          </span>
        ))}
        <input
          className="min-w-[120px] flex-1 bg-transparent py-0.5 text-xs text-zinc-200 placeholder-zinc-600 outline-none"
          disabled={saving}
          onBlur={addTag}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={tags.length === 0 ? placeholder : ""}
          ref={inputRef}
          type="text"
          value={input}
        />
      </div>
    </div>
  );
}
