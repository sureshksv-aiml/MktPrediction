"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Laptop } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSidebar } from "@/components/ui/sidebar";

const ICON_SIZE = 16;

interface SidebarThemeSwitcherProps {
  iconOnly?: boolean;
}

export const SidebarThemeSwitcher = ({
  iconOnly = false,
}: SidebarThemeSwitcherProps) => {
  const { open, isMobile } = useSidebar();
  const renderAsOpen = open || isMobile;
  // Use icon-only mode when prop is set or sidebar is collapsed
  const showIconOnly = iconOnly || !renderAsOpen;

  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Show skeleton while loading
    return (
      <Button variant="ghost" size="sm" className="p-2" disabled>
        <Skeleton className="h-4 w-4 rounded" />
        <span className="sr-only">Loading theme</span>
      </Button>
    );
  }

  const renderIcon = () => {
    if (theme === "light") return <Sun size={ICON_SIZE} />;
    if (theme === "dark") return <Moon size={ICON_SIZE} />;
    return <Laptop size={ICON_SIZE} />;
  };

  const renderLabel = () => {
    if (theme === "light") return "Light";
    if (theme === "dark") return "Dark";
    return "System";
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        {showIconOnly ? (
          <Button
            variant="ghost"
            size="sm"
            className="p-2"
            title={renderLabel()}
          >
            {renderIcon()}
            <span className="sr-only">Change theme</span>
          </Button>
        ) : (
          <Button variant="ghost" className="justify-center gap-2">
            {renderIcon()}
            <span>{renderLabel()}</span>
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-content" align="center">
        <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
          <DropdownMenuRadioItem
            value="light"
            className="flex gap-2 items-center"
          >
            <Sun size={ICON_SIZE} /> <span>Light</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            value="dark"
            className="flex gap-2 items-center"
          >
            <Moon size={ICON_SIZE} /> <span>Dark</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            value="system"
            className="flex gap-2 items-center"
          >
            <Laptop size={ICON_SIZE} /> <span>System</span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
