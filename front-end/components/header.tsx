"use client";

import Link from "next/link";
import { Bell, User } from "lucide-react";
import ModeToggle from "./mode-toggle";

export default function Header({ notifications = 0 }: { notifications?: number }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-hairline bg-[hsl(var(--bg)/0.85)] backdrop-blur">
      <div className="w-full px-3 sm:px-4">
        <div className="h-16 flex items-center justify-between">
          <Link href="/" className="font-medium tracking-tight text-xl">
            brand<span className="text-primary">OS</span>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3">
            {/* Bell (placeholder notifications) */}
            <button
              className="relative rounded-xl p-2 border-hairline hover:bg-[hsl(var(--muted))] transition"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
              {notifications > 0 && (
                <span className="ml-2 align-middle inline-block text-[10px] px-1.5 py-[2px] rounded-full bg-primary text-primaryFg">
                  {notifications}
                </span>
              )}
            </button>

            {/* Profile avatar (placeholder) */}
            <button
              className="rounded-full border-hairline w-9 h-9 flex items-center justify-center hover:bg-[hsl(var(--muted))] transition"
              aria-label="Account"
              title="Account"
            >
              <User className="h-5 w-5 opacity-80" />
            </button>

            <ModeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
}


