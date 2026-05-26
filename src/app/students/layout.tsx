import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Students | Developer Console",
  description: "View student data and progress",
};

export default function StudentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

