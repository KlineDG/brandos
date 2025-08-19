import type { Metadata } from "next";
import dynamic from "next/dynamic";

const Landing = dynamic(() => import("@/components/landing"))

export const metadata: Metadata = {
  title: "brandOS — AI brand creation",
  description: "Brainstorm, structure, visualize, and execute your brand idea — in minutes.",
  openGraph: {
    title: "brandOS — AI brand creation",
    description: "Brainstorm, structure, visualize, and execute your brand idea — in minutes.",
    url: "https://example.com/",
    siteName: "brandOS",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "brandOS" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "brandOS — AI brand creation",
    description: "Brainstorm, structure, visualize, and execute your brand idea — in minutes.",
    images: ["/og.png"],
  },
};

export default function Page() {
  return <Landing />;
}
