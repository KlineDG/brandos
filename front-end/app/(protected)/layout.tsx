import type { Metadata } from "next";
import type { ReactNode } from "react";
import DashboardHeader from "@/components/dashboard-header";
import { getCurrentUser } from "@/lib/utils";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "brandOS",
  description: "AI-powered brand creation and growth platform",
};

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/marketing");
  }

  const user = await getCurrentUser(supabase);

  return (
    <>
      <DashboardHeader user={user} />
      {children}
    </>
  );
}
