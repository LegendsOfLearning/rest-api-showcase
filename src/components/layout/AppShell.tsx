"use client";

import { useState } from "react";
import { ThemeProvider } from "@/contexts/theme";
import { ApiActivityProvider } from "@/contexts/api-activity";
import { SidebarNav } from "./SidebarNav";
import { TopBar } from "./TopBar";
import { ApiActivityDrawer } from "./ApiActivityDrawer";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <ThemeProvider>
      <ApiActivityProvider>
        <div className="min-h-screen flex bg-app text-foreground relative">
          <SidebarNav mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
          <div className="flex-1 flex flex-col min-h-screen">
            <TopBar onMenuClick={() => setMobileMenuOpen(true)} />
            <main className="flex-1 overflow-auto px-6 py-8">{children}</main>
          </div>
          <ApiActivityDrawer />
        </div>
      </ApiActivityProvider>
    </ThemeProvider>
  );
}
