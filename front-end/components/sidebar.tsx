"use client";

import { Folder, Lightbulb, LayoutGrid, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type FolderItem = { id: string; name: string; emoji?: string; count?: number };

export default function Sidebar({
  folders = [],
  activeFolderId,
  onSelectFolder,
  onNewProject,
  onSearch,
  onClickProjects,
}: {
  folders?: FolderItem[];
  activeFolderId?: string;
  onSelectFolder?: (id: string) => void;
  onNewProject?: () => void;
  onSearch?: (q: string) => void;
  onClickProjects?: () => void;
}) {
  const [query, setQuery] = useState("");
  const visibleFolders = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return folders;
    return folders.filter((f) => f.name.toLowerCase().includes(q));
  }, [folders, query]);

  return (
    <aside
      className={cn(
        "shrink-0 border-r border-hairline bg-[hsl(var(--card))]",
        "sticky top-16 h-[calc(100vh-4rem)]",
        "px-3 py-3 flex flex-col gap-3",
        "w-[280px]" // fixed width when mounted
      )}
      aria-label="Sidebar"
    >
      {/* New Project */}
      <div className="flex items-center">
        <button
          onClick={onNewProject ?? (() => {})}
          className="flex items-center justify-center gap-2 rounded-xl px-3 py-2 bg-primary text-primaryFg hover:opacity-95 transition"
          title="New project"
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm font-medium">New Project</span>
        </button>
      </div>

      {/* Search */}
      <div>
        <div className="flex items-center gap-2 border-hairline rounded-xl px-3 py-2">
          <Search className="h-4 w-4 opacity-60" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              onSearch?.(e.target.value);
            }}
            placeholder="Search folders…"
            className="bg-transparent outline-none text-sm w-full placeholder:opacity-50"
            aria-label="Search folders"
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        {/* Navigation */}
        <SectionHeader icon={<LayoutGrid className="h-4 w-4" />} label="Navigation" />
        <div className="mt-1 space-y-1">
          <SideLink label="Projects" icon={<LayoutGrid className="h-4 w-4 opacity-80" />} onClick={onClickProjects} />
        </div>

        {/* Folders */}
        <SectionHeader icon={<Folder className="h-4 w-4" />} label="Folders" />
        <ul className="mt-1 space-y-1">
          {visibleFolders.length === 0 && (
            <li className="text-xs opacity-60 px-2 py-2">No folders yet.</li>
          )}
          {visibleFolders.map((f) => {
            const active = f.id === activeFolderId;
            return (
              <li key={f.id}>
                <button
                  onClick={() => onSelectFolder?.(f.id)}
                  className={cn(
                    "w-full flex items-center gap-2 rounded-lg px-2 py-2 text-left transition",
                    "hover:bg-[hsl(var(--muted))]",
                    active && "bg-[hsl(var(--muted))]"
                  )}
                  title={f.name}
                >
                  <span className="inline-flex items-center justify-center w-6">
                    {f.emoji ? <span className="text-base leading-none">{f.emoji}</span> : <Folder className="h-4 w-4 opacity-80" />}
                  </span>
                  <span className="flex-1 truncate text-sm">{f.name}</span>
                  {typeof f.count === "number" && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded border-hairline">{f.count}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Suggestions (placeholder) */}
        <SectionHeader icon={<Lightbulb className="h-4 w-4" />} label="Suggestions" />
        <div className="mt-1 space-y-1">
          <SideChip label="Rework your tagline" />
          <SideChip label="Post 3-product carousel" />
          <SideChip label="Try a TikTok hook" />
        </div>
      </div>
    </aside>
  );
}

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="mt-4 mb-1 flex items-center gap-2 px-1">
      <span className="inline-flex items-center justify-center w-6 opacity-80">{icon}</span>
      <span className="text-[11px] uppercase tracking-wide opacity-60">{label}</span>
    </div>
  );
}
function SideLink({ label, icon, onClick }: { label: string; icon?: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 rounded-lg px-2 py-2 text-left transition hover:bg-[hsl(var(--muted))]"
      title={label}
    >
      <span className="inline-flex items-center justify-center w-6">{icon}</span>
      <span className="text-sm">{label}</span>
    </button>
  );
}
function SideChip({ label }: { label: string }) {
  return (
    <button
      className="max-w-full text-left px-2 py-1 rounded-lg border-hairline text-xs opacity-80 hover:opacity-100 transition"
      title={label}
    >
      <span className="block truncate">{label}</span>
    </button>
  );
}


