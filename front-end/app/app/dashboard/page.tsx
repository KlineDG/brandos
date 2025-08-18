"use client";

import Header from "@/components/header";
import Sidebar from "@/components/sidebar";
import ChatInput from "@/components/chat-input";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

type FolderItem = { id: string; name: string; emoji?: string; count?: number };

export default function HomeShell({
  folders,
  activeFolderId,
  notifications = 0,
}: {
  folders: FolderItem[];
  activeFolderId?: string;
  notifications?: number;
}) {
  const router = useRouter();

  // sidebar visibility persisted
  const [navOpen, setNavOpen] = useState(true);
  useEffect(() => {
    const saved = localStorage.getItem("nav-open");
    if (saved !== null) setNavOpen(saved === "1");
  }, []);
  useEffect(() => {
    localStorage.setItem("nav-open", navOpen ? "1" : "0");
  }, [navOpen]);

  return (
    <div className="min-h-screen">
      <Header notifications={notifications} />

      {/* Row covers full remaining viewport height */}
      <div className="w-full">
        <div className="flex min-h-[calc(100vh-4rem)]">
          {navOpen && (
            <Sidebar
              folders={folders}
              activeFolderId={activeFolderId}
              onSelectFolder={(id) => router.push(`/brand/${id}`)}
              onClickProjects={() => router.push("/projects")}
              onNewProject={() => router.push("/new")}
              onSearch={(q) => console.log("search:", q)}
            />
          )}

          {/* Main area + the arrow that controls nav visibility */}
          <div className="flex-1 relative flex">
            {/* Arrow lives INSIDE the content area, near its left edge */}
            <button
              onClick={() => setNavOpen((v) => !v)}
              className="absolute left-2 top-4 p-2 rounded-md hover:bg-[hsl(var(--muted))] transition"
              aria-label={navOpen ? "Close navigation" : "Open navigation"}
              title={navOpen ? "Close navigation" : "Open navigation"}
            >
              {navOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </button>

            {/* Centered content fills remaining space */}
            <section className="flex-1 p-6 sm:p-8 flex items-center justify-center">
              <div className="w-full max-w-3xl">
                <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-tight text-center md:text-left">
                  Build a brand that <span className="text-primary">grows</span> with you.
                </h1>
                <p className="mt-5 text-base md:text-lg opacity-80 text-center md:text-left">
                  Brainstorm, structure, visualize, and execute—powered by AI.
                </p>
                <div className="mt-8 flex gap-3 justify-center md:justify-start">
                  <Link
                    href="/new"
                    className="rounded-2xl px-5 py-3 bg-primary text-primaryFg hover:opacity-95 transition"
                  >
                    Create a brand
                  </Link>
                  <Link
                    href="/projects"
                    className="rounded-2xl px-5 py-3 border-hairline"
                  >
                    View projects
                  </Link>
                </div>

                <div className="mt-12 flex justify-center md:justify-start">
                  <div className="w-full max-w-2xl">
                    <ChatInput
                      placeholder='Ask BrandBot… e.g., "3 brand ideas for a fitness creator"'
                      onSubmit={(v) => console.log("Chat input:", v)}
                    />
                    <p className="mt-3 text-xs opacity-60 text-center md:text-left">
                      Tip: Try “Generate a brand concept for budget skincare targeting students.”
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

