"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "./AppShell";
import { ThemeProvider } from "@/contexts/theme";

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullScreenPage = pathname === "/login";

  if (isFullScreenPage) {
    return (
      <ThemeProvider>
        {children}
      </ThemeProvider>
    );
  }

  return <AppShell>{children}</AppShell>;
}
