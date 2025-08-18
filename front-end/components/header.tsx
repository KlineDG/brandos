"use client";
import Link from "next/link";
import ModeToggle from "./mode-toggle";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-transparent">
      <div className="container mx-auto flex items-center justify-between py-4">
        <Link href="/" className="font-medium tracking-tight text-xl">
          brand<span className="text-primary">OS</span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link href="/projects" className="text-sm opacity-80 hover:opacity-100">
            Projects
          </Link>
          <Link href="/new" className="text-sm opacity-80 hover:opacity-100">
            New
          </Link>
          <ModeToggle />
        </nav>
      </div>
    </header>
  );
}
