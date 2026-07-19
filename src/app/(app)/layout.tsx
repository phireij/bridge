import { redirect } from "next/navigation";

import { getUnreadInboxCount } from "@/lib/data";
import { getCurrentProfile } from "@/lib/auth/session";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const profile = await getCurrentProfile();

  // Bridge HQ auth not configured on this environment (e.g. local dev
  // without env vars) — fail open to the seeded shell rather than locking
  // everyone out. Once NEXT_PUBLIC_BRIDGE_SUPABASE_URL is set, this gate is
  // live: no session -> middleware already redirected to /login; a session
  // with no assigned role gets the pending screen below.
  const bridgeHqConfigured = Boolean(process.env.NEXT_PUBLIC_BRIDGE_SUPABASE_URL);

  if (bridgeHqConfigured && !profile) {
    redirect("/login");
  }

  if (bridgeHqConfigured && profile && profile.role === "unassigned") {
    return (
      <div className="flex min-h-svh items-center justify-center p-6 text-center">
        <div className="max-w-sm space-y-2">
          <h1 className="text-lg font-semibold">Access pending</h1>
          <p className="text-sm text-muted-foreground">
            Signed in as {profile.email}, but no role has been assigned yet.
            Ask the CEO to grant CEO / CTO / HyperAgent / Hermes access.
          </p>
        </div>
      </div>
    );
  }

  const unreadCount = await getUnreadInboxCount();

  return (
    <SidebarProvider>
      <AppSidebar unreadCount={unreadCount} />
      <SidebarInset>
        <TopBar unreadCount={unreadCount} />
        <main className="min-w-0 flex-1 p-4 sm:p-6">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
