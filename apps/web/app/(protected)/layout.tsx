import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { UserProvider } from "@/contexts/UserContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/layout/AppSidebar";
import { MobileHeaderContent } from "@/components/layout/MobileHeaderContent";
import { getCurrentUserWithRole } from "@/lib/auth";
import { TopicProvider } from "@/contexts/TopicContext";

// Force dynamic rendering to prevent static generation issues with authentication
export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  // Get user with role information from database
  const userWithRole = await getCurrentUserWithRole();

  if (!userWithRole) {
    redirect("/auth/login");
  }

  // Read sidebar state from cookie server-side
  const cookieStore = await cookies();
  const sidebarState = cookieStore.get("sidebar_state");
  const defaultOpen = sidebarState?.value === "false" ? false : true;

  return (
    <UserProvider value={userWithRole.user}>
      <TopicProvider>
        <SidebarProvider defaultOpen={defaultOpen}>
          <div className="flex h-screen w-full overflow-hidden">
            {/* Sidebar - Left */}
            <AppSidebar />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
              <MobileHeaderContent />
              <main className="flex-1 pt-14 lg:pt-0 bg-background overflow-hidden">
                {children}
              </main>
            </div>
          </div>
        </SidebarProvider>
      </TopicProvider>
    </UserProvider>
  );
}
