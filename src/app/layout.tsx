import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Analytics } from '@vercel/analytics/react';
import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Api Showcase",
  description: "Launch standards to students",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="w-full border-b border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <Link href="/" className="text-gray-700 hover:text-black">Home</Link>
              <Link href="/users" className="text-gray-700 hover:text-black">Users</Link>
              <Link href="/standards" className="text-gray-700 hover:text-black">Standards</Link>
              <Link href="/search" className="text-gray-700 hover:text-black">Search</Link>
              <Link href="/content" className="text-gray-700 hover:text-black">Content</Link>
              <Link href="/assignments" className="text-gray-700 hover:text-black">Assignments</Link>
              <Link href="/docs" className="text-gray-700 hover:text-black">Docs</Link>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-xs text-gray-500">REST API v3 Showcase</div>
              <LogoutButton />
            </div>
          </div>
        </nav>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
