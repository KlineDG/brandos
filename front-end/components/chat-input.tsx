"use client";
import { useState } from "react";
import { Send } from "lucide-react";

export default function ChatInput({
  placeholder = "Ask BrandBot anything…",
  onSubmit,
  onChange,
  onFocus,
}: {
  placeholder?: string;
  onSubmit?: (value: string) => void;
  onChange?: (value: string) => void;
  onFocus?: () => void;
}) {
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = value.trim();
    if (!v) return;
    onSubmit?.(v);
    setValue("");
    onChange?.("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-hairline rounded-2xl p-2 pl-3 flex items-center gap-2 shadow-soft"
    >
      <input
        value={value}
        onChange={(e) => { setValue(e.target.value); onChange?.(e.target.value); }}
        onFocus={() => onFocus?.()}
        placeholder={placeholder}
        className="bg-transparent outline-none w-full text-[15px] placeholder:opacity-50"
      />
      <button
        type="submit"
        className="inline-flex items-center gap-1 rounded-xl px-3 py-2 bg-primary text-primaryFg hover:opacity-95 transition"
        aria-label="Send"
      >
        <Send className="h-4 w-4" />
        <span className="sr-only">Send</span>
      </button>
    </form>
  );
}


