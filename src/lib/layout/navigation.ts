export type ConsoleNavItem = {
  href: string;
  label: string;
};

export type ConsoleNavSection = {
  label?: string;
  items: ConsoleNavItem[];
  inset?: boolean;
};

export const consoleNavSections: ConsoleNavSection[] = [
  {
    label: "Showcase",
    items: [
      { href: "/partners", label: "Launch & SSO" },
      { href: "/docs", label: "Integration Guide" },
    ],
  },
  {
    label: "Browse API",
    inset: true,
    items: [
      { href: "/content", label: "Content" },
      { href: "/standards", label: "Standards" },
      { href: "/users", label: "Users" },
      { href: "/search", label: "Search" },
    ],
  },
  {
    label: "Assignments",
    inset: true,
    items: [
      { href: "/assignments", label: "List" },
      { href: "/assignments/build", label: "Build" },
    ],
  },
  {
    label: "Assist",
    inset: true,
    items: [{ href: "/chat", label: "Chat" }],
  },
];

const pageTitles: Record<string, string> = {
  "/": "REST API Showcase",
  "/users": "Users",
  "/standards": "Standards",
  "/content": "Content",
  "/search": "Search",
  "/assignments": "Assignments",
  "/chat": "Chat",
  "/docs": "Integration Guide",
  "/partners": "Launch & SSO",
};

export function getConsolePageTitle(pathname?: string | null) {
  const title = pageTitles[pathname ?? ""];
  if (title) return title;

  if (pathname?.startsWith("/users/")) return "User Details";
  if (pathname?.startsWith("/content/")) return "Content Details";
  if (pathname?.startsWith("/assignments/build")) return "Build Assignment";
  if (pathname?.startsWith("/assignments/") && pathname !== "/assignments") return "Assignment Details";
  if (pathname === "/students") return "Students";
  if (pathname === "/login") return "Login";

  return "REST API Showcase";
}
