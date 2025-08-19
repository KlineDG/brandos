"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Plan = "free" | "basic" | "pro";

type PlanSpec = {
  id: Plan;
  name: string;
  price: string;
  period: string;
  blurb: string;
  features: string[];
  cta: string;
};

const PLANS: PlanSpec[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "/mo",
    blurb: "Basics to get started",
    features: ["Brand & DCA JSON (1 project)", "2 image generations", "Basic prompts"],
    cta: "Start free",
  },
  {
    id: "basic",
    name: "Basic",
    price: "$9",
    period: "/mo",
    blurb: "More prompts & assets",
    features: ["Up to 5 projects", "20 image generations", "Prompt templates", "Editable brand fields"],
    cta: "Choose Basic",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$29",
    period: "/mo",
    blurb: "Teams, regen controls, queues",
    features: ["Unlimited projects", "Priority image queue", "Team accounts", "Advanced regen controls"],
    cta: "Go Pro",
  },
];

export default function SignupModal({
  open,
  onOpenChangeAction,
  onSwitchToSignup, // accepted for API symmetry; not used here
  onSuccess,       // called after successful signup
}: {
  open: boolean;
  onOpenChangeAction: (v: boolean) => void;
  onSwitchToSignup?: () => void;
  onSuccess?: () => void;
}) {
  const [plan, setPlan] = useState<Plan>("free");
  const planSpec = useMemo(() => PLANS.find((p) => p.id === plan)!, [plan]);

  const [email, setEmail] = useState("");
  const [username, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email || !password || !username) {
      setError("Please fill all required fields.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, plan }, // stored in user_metadata
        // emailRedirectTo: `${location.origin}/auth/callback`, // if you enforce confirmations
      },
    });
    setSubmitting(false);

    if (error) {
      setError(error.message);
      return;
    }

    // Success: close modal and notify parent
    onOpenChangeAction(false);
    onSuccess?.();
  }

  async function continueWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/new` },
    });
  }
  async function continueWithApple() {
    await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: { redirectTo: `${location.origin}/new` },
    });
  }
  async function continueWithMeta() {
    await supabase.auth.signInWithOAuth({
      provider: "facebook", // Meta = Facebook in Supabase
      options: { redirectTo: `${location.origin}/new` },
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChangeAction}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content
          className="
            fixed left-1/2 top-1/2 w-[min(100vw,1100px)] max-h-[90vh]
            -translate-x-1/2 -translate-y-1/2 overflow-auto
            rounded-2xl border-hairline bg-[hsl(var(--card))] shadow-soft
          "
        >
          {/* Header */}
          <div className="px-6 py-6 md:px-8 md:py-8">
            <div className="flex items-center justify-between gap-4">
              <Dialog.Title className="text-xl md:text-2xl font-semibold">Create your account</Dialog.Title>
              <Dialog.Description className="text-sm opacity-70">
                Choose a plan; you can change anytime.
              </Dialog.Description>
            </div>

            {/* Pricing cards */}
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {PLANS.map((p) => {
                const active = p.id === plan;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlan(p.id)}
                    className={[
                      "text-left rounded-2xl border-hairline p-5 transition group",
                      "hover:bg-[hsl(var(--muted))]",
                      active ? "outline outline-2 outline-[hsl(var(--primary))]" : "",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs opacity-70">{p.blurb}</div>
                      </div>
                      <div className="text-right leading-none">
                        <div className="text-lg font-semibold">{p.price}</div>
                        <div className="text-xs opacity-70">{p.period}</div>
                      </div>
                    </div>

                    <ul className="mt-4 space-y-2">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <Check className="h-4 w-4 mt-[1px] opacity-80" />
                          <span className="text-sm opacity-90">{f}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-4">
                      <span
                        className={[
                          "inline-block text-xs rounded-lg px-2 py-1 border-hairline",
                          "group-hover:bg-[hsl(var(--muted))]",
                          active ? "bg-[hsl(var(--muted))]" : "",
                        ].join(" ")}
                      >
                        {p.cta}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-hairline" />

          {/* Auth form + providers */}
          <div className="px-6 py-6 md:px-8 md:py-8">
            <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-[1fr,320px]">
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    value={username}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Username"
                    className="w-full bg-transparent border-hairline rounded-xl px-3 py-2 outline-none"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full bg-transparent border-hairline rounded-xl px-3 py-2 outline-none"
                  />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-transparent border-hairline rounded-xl px-3 py-2 outline-none"
                />

                {error && <p className="text-sm text-red-400">{error}</p>}

                <div className="pt-2 flex justify-end gap-2">
                  <Dialog.Close className="rounded-xl px-4 py-2 border-hairline">Cancel</Dialog.Close>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-2xl px-4 py-2 bg-primary text-primaryFg disabled:opacity-60"
                  >
                    {submitting ? "Creating…" : `Create account (${planSpec.name})`}
                  </button>
                </div>
              </div>

              {/* Providers */}
              <div className="space-y-2">
                <div className="text-sm opacity-70">Or continue with</div>
                <ProviderButton label="Continue with Apple" onClick={continueWithApple} />
                <ProviderButton label="Continue with Google" onClick={continueWithGoogle} />
                <ProviderButton label="Continue with Meta" onClick={continueWithMeta} />
              </div>
            </form>

            <p className="text-[11px] opacity-60 mt-4">
              By continuing you agree to our Terms and Privacy Policy.
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ProviderButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 rounded-xl px-3 py-2 border-hairline hover:bg-[hsl(var(--muted))] transition"
    >
      {/* Placeholder icon circle; swap to brand SVGs later */}
      <span className="inline-block h-5 w-5 rounded-full border-hairline" aria-hidden />
      <span className="text-sm">{label}</span>
    </button>
  );
}
