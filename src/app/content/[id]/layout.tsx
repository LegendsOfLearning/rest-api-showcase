import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Content Details | Developer Console",
    description: "View content details, standards, and reviews",
  };
}

export default function ContentDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

