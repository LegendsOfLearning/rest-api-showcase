import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Analytics } from '@vercel/analytics/react';
import { ConditionalLayout } from '@/components/layout/ConditionalLayout';

const inter = Inter({ subsets: ["latin"] });
const themeScript = `
(function () {
  try {
    var stored = window.localStorage.getItem("lol-rest-theme");
    var system = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    var resolved = stored && stored !== "system" ? stored : system;
    var root = document.documentElement;
    root.dataset.theme = resolved;
    root.classList.remove("light", "dark");
    root.classList.add(resolved);
  } catch (error) {}
})();
`;

export const metadata: Metadata = {
  title: "Legends REST API Showcase",
  description: "Public app-scoped reference implementation for the Legends of Learning V3 REST API.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={inter.className}>
        <ConditionalLayout>
          {children}
        </ConditionalLayout>
        <Analytics />
      </body>
    </html>
  );
}
