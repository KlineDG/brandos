import Header from "@/components/header";
import Link from "next/link";
import ChatInput from "@/components/chat-input";

export default function Home() {
  return (
    <main className="relative">
      {/* Soft glow + grid background */}
      <div className="pointer-events-none absolute inset-0 bg-glow" />
      <div className="absolute inset-0 bg-grid" />

      <Header />

      <section className="container mx-auto pt-16 pb-24">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-tight">
            Build a brand that <span className="text-primary">grows</span> with you.
          </h1>
          <p className="mt-5 text-base md:text-lg opacity-80">
            Brainstorm, structure, visualize, and execute—powered by AI.
          </p>
          <div className="mt-8 flex gap-3">
            <Link
              href="/new"
              className="rounded-2xl px-5 py-3 bg-primary text-primaryFg shadow-soft hover:opacity-95 transition"
            >
              Create a brand
            </Link>
            <Link
              href="/projects"
              className="rounded-2xl px-5 py-3 border-hairline bg-glass shadow-soft"
            >
              View projects
            </Link>
          </div>
        </div>

        {/* Centered Chat Bar */}
        <div className="mt-14 flex justify-center">
          <div className="w-full max-w-2xl">
            <ChatInput
              placeholder="Ask BrandBot anything… e.g., “Give me 3 brand ideas for a fitness creator.”"
              
              
            />
            <p className="mt-3 text-xs opacity-60 text-center">
              Tip: Try “Generate a brand concept for budget skincare targeting students.”
            </p>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Ideation → Structure",
              desc: "Chat to explore concepts. Generate Brand + DCA as structured JSON.",
            },
            {
              title: "Visualize Instantly",
              desc: "Auto thumbnails, avatars, and moodboards with prompt overrides.",
            },
            {
              title: "Execute & Grow",
              desc: "Content calendars, platform kits, and market integrations ahead.",
            },
          ].map((f, i) => (
            <div key={i} className="border-hairline bg-glass rounded-2xl p-6">
              <h3 className="font-medium">{f.title}</h3>
              <p className="mt-2 text-sm opacity-80">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
