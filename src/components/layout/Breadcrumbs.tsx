"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { useMemo } from "react";

const routeLabels: Record<string, string> = {
  "/": "Showcase",
  "/users": "Users",
  "/standards": "Standards",
  "/content": "Content",
  "/search": "Search",
  "/assignments": "Assignments",
  "/docs": "Integration Guide",
  "/partners": "Launch & SSO",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const params = useParams();

  const breadcrumbs = useMemo(() => {
    if (!pathname) return [];

    const segments = pathname.split("/").filter(Boolean);
    const crumbs: Array<{ label: string; href: string }> = [];

    crumbs.push({ label: "Showcase", href: "/partners" });

    // Build breadcrumbs from segments
    let currentPath = "";
    segments.forEach((segment) => {
      currentPath += `/${segment}`;
      
      // Check if this is a dynamic segment (like [id])
      const isDynamic = !isNaN(Number(segment)) || segment.length > 20; // IDs are usually numbers or long strings
      
      if (isDynamic && params) {
        // Try to get a meaningful label from params or use the segment
        const paramKey = Object.keys(params).find(key => params[key] === segment);
        // For ID routes, show a shorter format
        const label = paramKey === "id" ? `#${segment}` : segment;
        crumbs.push({ label, href: currentPath });
      } else {
        // Use route label or capitalize segment
        const label = routeLabels[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
        crumbs.push({ label, href: currentPath });
      }
    });

    return crumbs;
  }, [pathname, params]);

  if (breadcrumbs.length <= 1) return null;

  return (
    <nav className="flex items-center gap-1.5 text-sm overflow-x-auto" aria-label="Breadcrumb">
      <ol className="flex items-center gap-1.5 min-w-0">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <li key={crumb.href} className="flex items-center gap-1.5 flex-shrink-0">
              {index > 0 && (
                <svg
                  className="h-3.5 w-3.5 text-muted flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              )}
              {isLast ? (
                <span className="text-foreground font-medium whitespace-nowrap">{crumb.label}</span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-muted hover:text-foreground transition-colors whitespace-nowrap"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
