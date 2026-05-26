"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApiActivity } from "@/contexts/api-activity";
import { consoleNavSections } from "@/lib/layout/navigation";

function NavContent({
  onLinkClick,
  showHeader = true,
}: {
  onLinkClick?: () => void;
  showHeader?: boolean;
}) {
  const pathname = usePathname();
  const { setDrawerOpen, entries } = useApiActivity();
  const hasActivity = entries.length > 0;
  
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href);
  };
  
  return (
    <div className="flex flex-col h-full">
      {showHeader ? (
        <div className="px-5 py-5">
          <div className="text-xs uppercase tracking-widest text-muted">Legends</div>
          <div className="mt-2 text-lg font-semibold text-foreground">REST API Showcase</div>
        </div>
      ) : null}
      <nav className="flex-1 px-3 space-y-4 overflow-y-auto">
        {consoleNavSections.map((section, sectionIndex) => (
          <div key={section.label ?? `section-${sectionIndex}`} className="space-y-1">
            {section.label ? (
              <div className="px-3 py-2 text-[11px] font-semibold text-muted uppercase tracking-wider">
                {section.label}
              </div>
            ) : null}
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onLinkClick}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  section.inset ? "ml-2" : ""
                } ${
                  isActive(item.href) ? "bg-accent/10 text-accent" : "text-muted hover:text-foreground hover:bg-surface-100"
                }`}
              >
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <div className="px-4 py-2 border-t border-border">
        <button
          type="button"
          onClick={() => {
            setDrawerOpen(true);
            onLinkClick?.();
          }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-muted hover:text-foreground hover:bg-surface-100"
        >
          <span className="relative flex h-2 w-2 flex-shrink-0">
            {hasActivity && (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
              </>
            )}
            {!hasActivity && (
              <span className="relative inline-flex rounded-full h-2 w-2 bg-muted" />
            )}
          </span>
          <span className="flex-1 text-left">API Activity</span>
          {hasActivity && (
            <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">
              {entries.length}
            </span>
          )}
        </button>
      </div>
      <div className="px-5 py-4 text-xs text-muted border-t border-border">One-app V3 reference</div>
    </div>
  );
}

interface SidebarNavProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export function SidebarNav({ mobileMenuOpen, setMobileMenuOpen }: SidebarNavProps) {
  return (
    <>
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile menu drawer */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-border transform transition-transform duration-300 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted">Legends</div>
              <div className="mt-1 text-sm font-semibold text-foreground">REST API Showcase</div>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-lg text-foreground hover:bg-surface-100"
              aria-label="Close menu"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <NavContent onLinkClick={() => setMobileMenuOpen(false)} showHeader={false} />
        </div>
      </aside>

      {/* Desktop sidebar - shows at lg (1024px) and above */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:h-screen border-r border-border bg-surface">
        <NavContent />
      </aside>
    </>
  );
}
