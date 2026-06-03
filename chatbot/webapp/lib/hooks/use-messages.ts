"use client";

import { useCallback, useState } from "react";

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function parseStoredContent(content: string) {
  if (!content.includes('"content"')) return content;

  let text = "";

  for (const line of content.split("\n")) {
    try {
      const parsed = JSON.parse(line);
      text += parsed?.content?.parts?.[0]?.text ?? "";
    } catch {
      // Ignore old malformed/raw stream lines.
    }
  }

  return text || content;
}

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const loadMessages = useCallback(async (threadId: string) => {
    setIsLoadingMessages(true);

    try {
      const res = await fetch(`/api/messages?threadId=${threadId}`);

      if (!res.ok) {
        throw new Error(`Failed to load messages: ${res.status}`);
      }

      const data = await res.json();

      setMessages(
        data.map((m: any) => ({
          id: m.messageId,
          role: m.role,
          content: parseStoredContent(m.content ?? ""),
        })),
      );
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  return {
    messages,
    setMessages,
    isRunning,
    setIsRunning,
    isLoadingMessages,
    loadMessages,
  };
}
