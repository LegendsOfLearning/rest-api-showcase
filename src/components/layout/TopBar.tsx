"use client";

import LogoutButton from "@/components/LogoutButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AppContextStrip } from "@/components/layout/AppContextStrip";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { useApiActivity } from "@/contexts/api-activity";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getV3Path } from "@/lib/api-path";
import { getConsolePageTitle } from "@/lib/layout/navigation";

interface TopBarProps {
  onMenuClick?: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const pathname = usePathname();
  const title = getConsolePageTitle(pathname);
  const { setDrawerOpen, entries } = useApiActivity();
  const isPublicGuide = pathname === "/docs";

  const lastCall = entries[0];

  return (
    <>
      <header className="sticky top-0 z-20 backdrop-blur bg-surface/80 border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg text-foreground hover:bg-surface-100 flex-shrink-0"
              aria-label="Open menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold text-foreground">{title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-2 rounded-full border border-border/60 px-3 md:px-4 py-2 text-sm text-muted hover:text-foreground hover:border-foreground/40 transition-colors"
            aria-label="Open API Activity drawer"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
            </span>
            <span className="hidden md:inline">{lastCall ? `${lastCall.method} ${getV3Path(lastCall)}` : "API Activity"}</span>
            {entries.length > 0 && (
              <span className="md:hidden text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                {entries.length}
              </span>
            )}
          </button>
          <ThemeToggle />
          {isPublicGuide ? (
            <Link
              href="/login"
              className="rounded-full border border-border/60 px-3 py-2 text-sm text-muted transition-colors hover:border-foreground/40 hover:text-foreground md:px-4"
            >
              Connect App
            </Link>
          ) : (
            <LogoutButton />
          )}
        </div>
      </header>
      <div className="sticky top-[73px] z-10 bg-surface/80 backdrop-blur border-b border-border px-6 py-2 lg:px-6">
        <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <Breadcrumbs />
          <AppContextStrip />
        </div>
      </div>
    </>
  );
}
