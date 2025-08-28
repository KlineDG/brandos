"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { z } from "zod";

export default function LoginModal({
  open,
  onOpenChangeAction,
  onSwitchToSignup,
  onSuccess,
}: {
  open: boolean;
  onOpenChangeAction: (v: boolean) => void;
  onSwitchToSignup?: () => void;
  onSuccess?: () => void; // e.g., router.push("/dashboard")
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const LoginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

  async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setError(null);
  setSubmitting(true);

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    console.log("signIn result:", { data, error }); // <-- this logs the REAL response

    if (error) {
      setError(error.message);
      return;
    }

    // success
    onOpenChangeAction(false);   // close modal
    onSuccess?.();               // parent does router.push("/dashboard")
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    setError(message);
  } finally {
    setSubmitting(false);
  }
}

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChangeAction}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-[min(100vw,720px)] max-h-[85vh] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-2xl border-hairline bg-[hsl(var(--card))] shadow-soft p-0">
          <div className="px-6 py-6 md:px-8 md:py-8">
            <Dialog.Title className="text-xl md:text-2xl font-semibold">Log in</Dialog.Title>
            <Dialog.Description className="text-sm opacity-70 mt-1">Welcome back to brandOS.</Dialog.Description>

            <form onSubmit={handleSubmit} className="mt-6 space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full bg-transparent border-hairline rounded-xl px-3 py-2 outline-none"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-transparent border-hairline rounded-xl px-3 py-2 outline-none"
              />
              {error && <p className="text-sm text-red-400">{error}</p>}

              <div className="flex items-center justify-between text-sm">
                <button type="button" className="opacity-70 hover:opacity-100">Forgot password?</button>
                <div className="opacity-70">
                  No account?{" "}
                  <button type="button" onClick={onSwitchToSignup} className="underline underline-offset-2 hover:opacity-100">
                    Sign up
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Dialog.Close className="rounded-xl px-4 py-2 border-hairline" disabled={submitting}>Cancel</Dialog.Close>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-2xl px-4 py-2 bg-primary text-primaryFg disabled:opacity-60"
                >
                  {submitting ? "Logging in…" : "Log in"}
                </button>
              </div>
            </form>

            {/* Optional: social login (hook up later) */}
            <div className="mt-6 grid gap-2 sm:grid-cols-3">
              <button disabled className="rounded-xl px-3 py-2 border-hairline opacity-70">Apple</button>
              <button disabled className="rounded-xl px-3 py-2 border-hairline opacity-70">Google</button>
              <button disabled className="rounded-xl px-3 py-2 border-hairline opacity-70">Meta</button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}



