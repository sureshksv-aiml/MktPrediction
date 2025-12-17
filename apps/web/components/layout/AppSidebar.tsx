"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
  Clock,
  User,
  LogIn,
  Menu,
  ChevronLeft,
  PanelLeftIcon,
  LogOut,
  Settings,
  TrendingUp,
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { logoutAction } from "@/app/actions/auth";
import { SidebarThemeSwitcher } from "@/components/SidebarThemeSwitcher";
import Logo from "../Logo";
import { UserDisplay } from "./UserDisplay";

export default function AppSidebar(): React.ReactElement {
  const pathname = usePathname();
  const router = useRouter();
  const { open, isMobile, toggleSidebar } = useSidebar();
  const { id: userId } = useUser();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Build navigation items
  const navItems = [
    { href: "/volatility", label: "Volatility", icon: TrendingUp },
    { href: "/history", label: "History", icon: Clock },
    { href: "/preferences", label: "Preferences", icon: Settings },
    { href: "/profile", label: "Profile", icon: User },
  ];

  const renderContentAsOpen = open || isMobile;

  const handleLogout = async (): Promise<void> => {
    setIsLoggingOut(true);

    try {
      const result = await logoutAction();

      if (result.success) {
        toast.success("Successfully logged out!");
        router.push("/");
      } else {
        toast.error(result.error);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Logout failed";
      toast.error(errorMessage);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleNavClick = (): void => {
    // On mobile, collapse the sidebar when a nav item is clicked
    if (isMobile) {
      toggleSidebar();
    }
  };

  const getLinkClasses = (href: string): string => {
    const isActive = pathname === href || pathname.startsWith(`${href}/`);
    return cn(
      "flex items-center w-full rounded-lg text-sm font-medium transition-colors",
      isActive
        ? "bg-primary text-white [&>*]:text-white"
        : "hover:bg-accent",
      renderContentAsOpen ? "px-2 py-1.5" : "h-8 w-8 justify-center p-0"
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r bg-sidebar">
      <SidebarHeader
        className={cn(
          "flex items-center h-12 border-b",
          renderContentAsOpen
            ? "flex-row px-2 gap-1"
            : "flex-col justify-center px-2 gap-1"
        )}
      >
        {/* Logo when expanded */}
        {renderContentAsOpen && (
          <Logo className="text-sm" width={22} height={22} />
        )}

        {/* Spacer */}
        {renderContentAsOpen && <div className="flex-1" />}

        {/* Theme switcher */}
        <SidebarThemeSwitcher iconOnly />

        {/* Desktop collapse button */}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
            aria-expanded={open}
            onClick={() => toggleSidebar()}
            className="h-7 w-7 rounded-md hover:bg-muted transition-colors"
          >
            {open ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </Button>
        )}

        {/* Mobile close button */}
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="p-1 h-auto w-auto"
            onClick={() => toggleSidebar()}
          >
            <PanelLeftIcon className="h-5 w-5" />
            <span className="sr-only">Close sidebar</span>
          </Button>
        )}
      </SidebarHeader>

      <SidebarContent className="flex-grow flex flex-col">
        {/* Navigation Items */}
        <SidebarGroup className="p-2 pt-4">
          <SidebarMenu className="space-y-1">
            {navItems.map((item) => (
              <SidebarMenuItem
                key={item.href}
                className={cn(
                  "flex justify-center",
                  renderContentAsOpen && "px-2"
                )}
              >
                <Link
                  href={item.href}
                  className={getLinkClasses(item.href)}
                  onClick={handleNavClick}
                >
                  <item.icon
                    className={cn(
                      renderContentAsOpen ? "h-4 w-4 mr-2" : "h-4 w-4"
                    )}
                    strokeWidth={2.5}
                  />
                  {renderContentAsOpen && <span>{item.label}</span>}
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* Spacer */}
        <div className="flex-1" />
      </SidebarContent>

      <SidebarFooter className="border-t p-2 pb-12">
        {/* User Display */}
        <UserDisplay />

        {/* Logout/Login - matching nav item structure */}
        <SidebarMenu>
          <SidebarMenuItem
            className={cn("flex justify-center", renderContentAsOpen && "px-2")}
          >
            {userId ? (
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={cn(
                  "flex items-center w-full rounded-lg text-sm font-medium transition-colors hover:bg-accent",
                  renderContentAsOpen ? "px-2 py-1.5" : "h-8 w-8 justify-center p-0"
                )}
              >
                <LogOut
                  className={cn(renderContentAsOpen ? "h-4 w-4 mr-2" : "h-4 w-4")}
                  strokeWidth={2.5}
                />
                {renderContentAsOpen && (
                  <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
                )}
                {!renderContentAsOpen && (
                  <span className="sr-only">
                    {isLoggingOut ? "Logging out..." : "Logout"}
                  </span>
                )}
              </button>
            ) : (
              <Link
                href="/auth/login"
                className={cn(
                  "flex items-center w-full rounded-lg text-sm font-medium transition-colors hover:bg-accent",
                  renderContentAsOpen ? "px-2 py-1.5" : "h-8 w-8 justify-center p-0"
                )}
              >
                <LogIn
                  className={cn(renderContentAsOpen ? "h-4 w-4 mr-2" : "h-4 w-4")}
                  strokeWidth={2.5}
                />
                {renderContentAsOpen && <span>Login</span>}
                {!renderContentAsOpen && <span className="sr-only">Login</span>}
              </Link>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
