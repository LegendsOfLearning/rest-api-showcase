import { ChatPage } from "@/components/chat/ChatPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chat | Developer Console",
  description: "Console helper for content search, previews, and assignment launch workflows",
};

export default function Chat() {
  return <ChatPage />;
}
