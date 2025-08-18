"use client";
import { useState } from "react";
import { Send } from "lucide-react";

export default function ChatInput({
  placeholder = "Ask BrandBot anything…",
  onSubmit,
}: {
  placeholder?: string;
  onSubmit?: (value: string) => void;
}) {
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = value.trim();
    if (!v) return;
    onSubmit?.(v);
    setValue("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-hairline bg-glass rounded-2xl p-2 pl-3 flex items-center gap-2 shadow-soft"
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
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

