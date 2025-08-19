"use client";

import Header from "@/components/header";
import ChatInput from "@/components/chat-input";
import SignupModal from "@/components/modals/signup-modal";
import LoginModal from "@/components/modals/login-modal";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const placeholderBrands = [
  { id: "b1", name: "Budget Skincare", tagline: "Clear skin without breaking the bank." },
  { id: "b2", name: "Athletica", tagline: "Move better, feel stronger." },
  { id: "b3", name: "Bean & Bloom", tagline: "Coffee for your creative mornings." },
  { id: "b4", name: "Leap Learning", tagline: "Micro-courses for busy minds." },
  { id: "b5", name: "CozyHaus", tagline: "Home goods with heart." },
  { id: "b6", name: "Wave Studio", tagline: "Audio that stands out." },
];

export default function Landing() {
  const router = useRouter();

  const [signupOpen, setSignupOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [typing, setTyping] = useState(false);

  const grid = useMemo(() => placeholderBrands, []);

  return (
    <div className="min-h-screen">
      <Header
        showAuth
        onLogin={() => setLoginOpen(true)}
        onSignup={() => setSignupOpen(true)}
        showAbout
      />

      <main className="w-full">
        <section className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-20 sm:py-28 px-4">
          <div className="w-full max-w-5xl">
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-tight text-center">
              Build a brand that <span className="text-primary">grows</span> with you.
            </h1>
            <p className="mt-6 text-base md:text-lg opacity-80 text-center max-w-3xl mx-auto">
              Brainstorm, structure, visualize, and execute—powered by AI.
            </p>

            <div className="mt-10 flex justify-center gap-3">
              <button
                className="rounded-2xl px-5 py-3 bg-primary text-primaryFg hover:opacity-95 transition"
                onClick={() => setSignupOpen(true)}
              >
                Create a brand
              </button>
            </div>

            {/* Chat bar */}
            <div className="mt-12 flex justify-center">
              <div className="w-full max-w-2xl">
                <ChatInput
                  placeholder='Ask BrandBot… e.g., "3 brand ideas for a fitness creator"'
                  onChange={(v) => setTyping(!!v)}
                  onSubmit={() => setSignupOpen(true)}
                />
                <p className="mt-4 text-xs opacity-60 text-center">
                  Tip: Try “Generate a brand concept for budget skincare targeting students.”
                </p>
              </div>
            </div>

            {/* Top Brands: hidden on mobile, auto-hide while typing */}
            {!typing && (
              <div className="mt-14 hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {grid.map((b) => (
                  <div key={b.id} className="rounded-2xl border-hairline p-5">
                    <div className="aspect-[16/9] rounded-xl bg-[hsl(var(--muted))] mb-4 overflow-hidden" />
                    <div className="font-medium">{b.name}</div>
                    <div className="text-sm opacity-70">{b.tagline}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Modals */}
      <SignupModal
        open={signupOpen}
        onOpenChangeAction={setSignupOpen}
        onSwitchToSignup={() => { 
          setLoginOpen(true);
          setSignupOpen(false);
        }}
        onSuccess={() => router.push("/new")}
      />
      <LoginModal
        open={loginOpen}
        onOpenChangeAction={setLoginOpen}
        onSwitchToSignup={() => {
          setLoginOpen(false);
          setSignupOpen(true);
        }}
        onSuccess={() => router.push("/app/dashboard")}
      />
    </div>
  );
}

