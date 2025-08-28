"use client";

import Link from "next/link";
import Image from "next/image";
import { Bell } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import ModeToggle from "@/components/mode-toggle";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function DashboardHeader({ user }: { user: User | null }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-hairline bg-[hsl(var(--bg)/0.85)] backdrop-blur">
      <div className="h-16 px-6 sm:px-8 flex items-center justify-between">
        <Link href="/" className="font-medium tracking-tight text-xl">
          brand<span className="text-primary">OS</span>
        </Link>
        <div className="flex items-center gap-4 sm:gap-5">
          <Link
            href="/upgrade"
            className="rounded-md px-3 py-2 bg-primary text-primaryFg text-sm hover:opacity-95 transition"
          >
            Upgrade
          </Link>

          <ModeToggle />
          <Bell className="h-5 w-5" />
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="w-8 h-8 rounded-full overflow-hidden border">

                {user?.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt="Avatar"
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center text-sm">
                    ?
                  </div>
                )}
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content
              align="end"
              className="min-w-[160px] bg-popover text-popover-foreground rounded-md shadow-md p-1"
            >
              <DropdownMenu.Item asChild>
                <Link
                  href="/account"
                  className="block px-2 py-1.5 rounded-md text-sm hover:bg-muted"
                >
                  View account
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Item asChild>
                <Link
                  href="/settings"
                  className="block px-2 py-1.5 rounded-md text-sm hover:bg-muted"
                >
                  Settings
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onSelect={async () => {
                  await supabase.auth.signOut();
                }}
                className="px-2 py-1.5 rounded-md text-sm hover:bg-muted cursor-pointer"
              >
                Sign out
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>
      </div>
    </header>
  );
}

