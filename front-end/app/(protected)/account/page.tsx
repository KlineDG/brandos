import Image from "next/image";
import Link from "next/link";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export default async function AccountPage() {
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
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Account</h1>
      {user ? (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            {user.avatar_url ? (
              <Image
                src={user.avatar_url}
                alt="Avatar"
                width={64}
                height={64}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-xl">
                ?
              </div>
            )}
            <div>
              <p className="text-lg font-medium">{user.email}</p>
            </div>
          </div>

          <div>
            <button
              disabled
              className="px-4 py-2 rounded-md bg-muted text-muted-foreground cursor-not-allowed"
            >
              Edit profile (coming soon)
            </button>
          </div>

          <div>
            <Link
              href="/billing"
              className="text-primary underline"
            >
              Billing information
            </Link>
          </div>
        </div>
      ) : (
        <p>No user found.</p>
      )}
    </div>
  );
}

