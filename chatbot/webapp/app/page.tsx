"use client";

import { useEffect, useRef, useState } from "react";
import ChatInput from "@/components/chatinput";
import { UserMessage } from "@/components/usermessage";
import { AssistantMessage } from "@/components/assistantmessage";
import type { Message } from "@/types";

export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (content: string) => {
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content },
    ]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-secret": process.env.NEXT_PUBLIC_API_SECRET!,
        },
        body: JSON.stringify({ message: content }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }

      const data = await res.json();
      setMessages((prev) => [...prev, data]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Something went wrong reaching the agent. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="h-screen flex flex-col bg-[var(--bg-base)]">
      {/* Scrollable messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-4">
            <div className="assistant-avatar w-14 h-14 rounded-2xl">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <rect x="3" y="8" width="18" height="13" rx="3" />
                <path d="M8 8V6a4 4 0 0 1 8 0v2" />
                <circle cx="9" cy="14" r="1.2" fill="currentColor" />
                <circle cx="15" cy="14" r="1.2" fill="currentColor" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-1">
                Welcome to DolFin AI
              </h1>
              <p className="text-sm text-[var(--text-secondary)] max-w-sm">
                Ask me about stock forecasts, risk assessments, or market
                education.
              </p>
            </div>
            {/* Suggestion chips */}
            <div className="flex flex-wrap gap-2 justify-center mt-2 max-w-lg">
              {[
                "Forecast AAPL for the next 30 days",
                "What is the risk profile of TSLA?",
                "Explain dollar cost averaging",
                "Is NVDA a good investment right now?",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSend(suggestion)}
                  className="
                    text-xs px-3 py-2 rounded-xl
                    border border-[var(--border)]
                    bg-[var(--bg-surface)] text-[var(--text-secondary)]
                    hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)]
                    hover:border-[var(--border-input)]
                    transition-all duration-150
                  "
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 pt-8 pb-48 flex flex-col gap-8">
            {messages.map((message) =>
              message.role === "user" ? (
                <UserMessage key={message.id} message={message} />
              ) : (
                <AssistantMessage key={message.id} message={message} />
              ),
            )}

            {/* Typing indicator */}
            {isLoading && (
              <div className="message-assistant">
                <div className="assistant-header">
                  <div className="assistant-avatar">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <rect x="3" y="8" width="18" height="13" rx="3" />
                      <path d="M8 8V6a4 4 0 0 1 8 0v2" />
                      <circle cx="9" cy="14" r="1.2" fill="currentColor" />
                      <circle cx="15" cy="14" r="1.2" fill="currentColor" />
                    </svg>
                  </div>
                  <span className="assistant-name">DolFin</span>
                </div>
                <div className="typing-indicator">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Fixed input */}
      <div className="fixed bottom-0 left-0 right-0 bg-[var(--bg-base)]">
        <div className="h-10 bg-gradient-to-t from-[var(--bg-base)] to-transparent -mt-10 pointer-events-none" />
        <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 pb-6 pt-1">
          <ChatInput onSend={handleSend} disabled={isLoading} />
        </div>
      </div>
    </main>
  );
}
