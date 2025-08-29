import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Upgrade Plan",
};

const tiers = [
  {
    name: "Free",
    price: "$0",
    description: "Basic features to explore the platform",
    features: ["1 project", "Community support"],
    href: "#",
  },
  {
    name: "Pro",
    price: "$12/mo",
    description: "Advanced tools for growing teams",
    features: ["Unlimited projects", "Priority support", "Advanced analytics"],
    href: "#",
  },
  {
    name: "Business",
    price: "$49/mo",
    description: "Everything you need for large organizations",
    features: ["Everything in Pro", "Dedicated support", "Custom integrations"],
    href: "#",
  },
];

export default function UpgradePage() {
  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10">
      <h1 className="text-3xl font-bold text-center mb-10">Choose your plan</h1>
      <div className="grid gap-6 md:grid-cols-3">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className="flex flex-col border-hairline rounded-xl bg-glass p-6 shadow-soft"
          >
            <h2 className="text-xl font-semibold mb-2">{tier.name}</h2>
            <p className="text-4xl font-bold mb-4">{tier.price}</p>
            <p className="mb-4 text-sm opacity-80">{tier.description}</p>
            <ul className="mb-6 space-y-2 text-sm flex-1">
              {tier.features.map((f) => (
                <li key={f}>• {f}</li>
              ))}
            </ul>
            <Link
              href={tier.href}
              className="mt-auto w-full rounded-md bg-primary text-primaryFg px-4 py-2 text-center text-sm font-medium hover:opacity-90 transition"
            >
              Choose Plan
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

