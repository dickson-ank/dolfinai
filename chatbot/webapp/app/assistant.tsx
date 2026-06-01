"use client";

import { AssistantRuntimeProvider, useExternalStoreRuntime } from "@assistant-ui/react";
import type { AppendMessage } from "@assistant-ui/react";
import { Thread } from "@/components/thread";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ThreadListSidebar } from "@/components/threadlist-sidebar";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

import { LoginButton, SignOutButton } from "@/components/auth-buttons";
// import { Separator } from "@/components/ui/separator";
import { useState, useCallback, useRef } from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export const Assistant = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const threadIdRef = useRef<string | undefined>(undefined);

  const onNew = useCallback(
    async (message: AppendMessage) => {
      const userText = message.content
        .filter((c) => c.type === "text")
        .map((c) => c.text ?? "")
        .join("");

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: userText,
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsRunning(true);

      const assistantId = crypto.randomUUID();

      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "" },
      ]);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            threadId: threadIdRef.current,
            message: userText,
          }),
        });

        if (!res.ok || !res.body) {
          const errorText = await res.text();
          console.error("API error:", res.status, errorText);
          throw new Error(`Request failed: ${res.status} – ${errorText}`);
        }

        const returnedThreadId = res.headers.get("x-thread-id");
        if (returnedThreadId) threadIdRef.current = returnedThreadId;

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // GCP streams newline-delimited JSON (not SSE)
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? ""; // keep incomplete last line

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            try {
              const parsed = JSON.parse(trimmed);
              const text = parsed?.content?.parts?.[0]?.text ?? "";

              if (text) {
                accumulated += text;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: accumulated } : m,
                  ),
                );
              }
            } catch {
              // incomplete or non-JSON line, skip
            }
          }
        }
      } catch (err) {
        console.error("Chat error:", err);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "Something went wrong. Please try again." }
              : m,
          ),
        );
      } finally {
        setIsRunning(false);
      }
    },
    [],
  );

  const runtime = useExternalStoreRuntime({
    messages,
    isRunning,
    onNew,
    convertMessage: (m: Message) => ({
      role: m.role,
      id: m.id,
      content: [{ type: "text" as const, text: m.content }],
    }),
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <SidebarProvider>
        <div className="flex h-dvh w-full pr-0.5">
          <ThreadListSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
              <SidebarTrigger />
              {/* <Separator
                orientation="vertical"
                className="border-border mr-2 h-4"
              /> */}
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink
                      href="/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      DolFin AI
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Starter Thread</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>

              <div className="flex items-center gap-2">
                <LoginButton />
                <SignOutButton />
              </div>
            </header>
            <div className="flex-1 overflow-hidden">
              <Thread />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AssistantRuntimeProvider>
  );
};
