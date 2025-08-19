"use client";

import Link from "next/link";
import ModeToggle from "./mode-toggle";

export default function Header({
  showAuth = true,
  onLogin,
  onSignup,
  showAbout = true,
}: {
  showAuth?: boolean;
  onLogin?: () => void;
  onSignup?: () => void;
  showAbout?: boolean;
}) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-hairline bg-[hsl(var(--bg)/0.85)] backdrop-blur">
      {/* remove max-w container; let it go edge-to-edge, with just padding */}
      <div className="w-full px-3 sm:px-4">
        <div className="h-16 flex items-center justify-between">
          <Link href="/" className="font-medium tracking-tight text-xl">
            brand<span className="text-primary">OS</span>
          </Link>

          <nav className="flex items-center gap-3 sm:gap-4">
            {showAbout && (
              <Link href="/about" className="text-sm opacity-80 hover:opacity-100">
                About
              </Link>
            )}
            {showAuth && (
              <>
                <button onClick={onLogin} className="text-sm opacity-80 hover:opacity-100">
                  Log in
                </button>
                <button
                  onClick={onSignup}
                  className="rounded-xl px-3 py-2 bg-primary text-primaryFg hover:opacity-95 transition text-sm"
                >
                  Sign up
                </button>
              </>
            )}
            <ModeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
}




