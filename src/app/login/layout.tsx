import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in | Legends REST API Showcase",
  description: "Sign in with one OAuth application to run the public Legends REST API showcase.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
