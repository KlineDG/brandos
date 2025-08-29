"use client";

import { useEffect, useState } from "react";
import ModeToggle from "@/components/mode-toggle";

export default function SettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("emailNotifications");
    if (stored !== null) {
      setEmailNotifications(stored === "true");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("emailNotifications", String(emailNotifications));
  }, [emailNotifications]);

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-8">
      <section>
        <h2 className="text-xl font-semibold mb-2">Appearance</h2>
        <div className="flex items-center justify-between">
          <span>Theme</span>
          <ModeToggle />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Notifications</h2>
        <label className="flex items-center justify-between">
          <span>Email notifications</span>
          <input
            type="checkbox"
            checked={emailNotifications}
            onChange={(e) => setEmailNotifications(e.target.checked)}
            className="h-4 w-4"
          />
        </label>
      </section>
    </main>
  );
}

