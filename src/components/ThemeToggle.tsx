"use client";

import { useTheme } from "@/contexts/theme";

const themeOptions: { value: "light" | "dark" | "system"; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" }
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5">
      {themeOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setTheme(option.value)}
          className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
            theme === option.value 
              ? "bg-accent/10 text-accent border border-accent/20" 
              : "text-muted hover:text-foreground hover:bg-surface-100"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

