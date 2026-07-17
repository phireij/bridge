import { getUnreadInboxCount } from "@/lib/data";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
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
