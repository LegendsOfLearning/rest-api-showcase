import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "User Details | Developer Console",
    description: "View and edit user details",
  };
}

export default function UserDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

