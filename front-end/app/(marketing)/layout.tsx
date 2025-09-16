import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "brandOS",
  description: "AI brand creation.",
};

export default function MarketingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
