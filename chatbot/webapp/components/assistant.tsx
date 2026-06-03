"use client";

import {
  AssistantRuntimeProvider,
  useExternalStoreRuntime,
} from "@assistant-ui/react";
import type { AppendMessage } from "@assistant-ui/react";

import { Thread } from "@/components/thread";
import { ThreadListSidebar } from "@/components/threadlist-sidebar";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

import { useRouter } from "next/navigation";
import { LoginButton, SignOutButton } from "@/components/auth-buttons";
import { useState, useCallback, useEffect, useRef } from "react";
import { useThreads } from "@/lib/hooks/use-threads";
import { useMessages } from "@/lib/hooks/use-messages";
import { useUser } from "@/lib/user-creds-provider";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export const Assistant = ({
  initialThreadId,
}: {
  initialThreadId?: string | null;
}) => {
  const user = useUser();

  const router = useRouter();

  const { threads, loading: loadingThreads, reloadThreads } = useThreads();
  const {
    messages,
    setMessages,
    isRunning,
    setIsRunning,
    isLoadingMessages,
    loadMessages,
  } = useMessages();

  const [activeThreadId, setActiveThreadId] = useState<string | null>(
    initialThreadId ?? null,
  );

  const skipNextLoadRef = useRef<string | null>(null);

  const currentThread = threads.find(
    (thread) => thread.threadId === activeThreadId,
  );

  useEffect(() => {
    setActiveThreadId(initialThreadId ?? null);

    if (!initialThreadId) {
      setMessages([]);
    }
  }, [initialThreadId, setMessages]);

  useEffect(() => {
    if (!activeThreadId) return;

    if (skipNextLoadRef.current === activeThreadId) {
      skipNextLoadRef.current = null;
      return;
    }

    loadMessages(activeThreadId);
  }, [activeThreadId, loadMessages]);

  const handleThreadSelect = useCallback((threadId: string) => {
    setActiveThreadId(threadId);

    window.history.pushState(null, "", `/t/${threadId}`);
  }, []);

  const handleNewThread = useCallback(() => {
    setActiveThreadId(null);
    setMessages([]);

    window.history.pushState(null, "", "/");
  }, [setMessages]);

  const onNew = useCallback(
    async (message: AppendMessage) => {
      const userText = message.content
        .filter((c) => c.type === "text")
        .map((c) => c.text ?? "")
        .join("");

      if (!userText.trim()) return;

      const userId = crypto.randomUUID();
      const assistantId = crypto.randomUUID();

      setMessages((prev) => [
        ...prev,
        {
          id: userId,
          role: "user",
          content: userText,
        },
        {
          id: assistantId,
          role: "assistant",
          content: "",
        },
      ]);

      setIsRunning(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            threadId: activeThreadId,
            message: userText,
          }),
        });

        if (!res.ok || !res.body) {
          const errorText = await res.text();
          throw new Error(`Request failed: ${res.status} - ${errorText}`);
        }

        const returnedThreadId = res.headers.get("x-thread-id");

        if (returnedThreadId && returnedThreadId !== activeThreadId) {
          skipNextLoadRef.current = returnedThreadId;

          setActiveThreadId(returnedThreadId);

          window.history.replaceState(null, "", `/t/${returnedThreadId}`);

          void reloadThreads();
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        let accumulated = "";
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();

            if (!trimmed) continue;

            try {
              const parsed = JSON.parse(trimmed);
              const text = parsed?.content?.parts?.[0]?.text ?? "";

              if (!text) continue;

              accumulated += text;

              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? {
                        ...m,
                        content: accumulated,
                      }
                    : m,
                ),
              );
            } catch {
              // Ignore malformed/incomplete JSON lines.
            }
          }
        }

        void reloadThreads();
      } catch (err) {
        console.error(err);

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: "Something went wrong. Please try again.",
                }
              : m,
          ),
        );
      } finally {
        setIsRunning(false);
      }
    },
    [activeThreadId, reloadThreads, setMessages, setIsRunning],
  );

  const runtime = useExternalStoreRuntime({
    messages,
    isRunning,
    onNew,

    convertMessage: (m: Message) => ({
      role: m.role,
      id: m.id,
      content: [
        {
          type: "text" as const,
          text: m.content,
        },
      ],
    }),
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <SidebarProvider>
        <div className="flex h-dvh w-full pr-0.5">
          <ThreadListSidebar
            threads={threads}
            loadingThreads={loadingThreads}
            activeThreadId={activeThreadId}
            onThreadSelect={handleThreadSelect}
            onNewThread={handleNewThread}
          />

          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
              <SidebarTrigger />

              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/">DolFin AI</BreadcrumbLink>
                  </BreadcrumbItem>

                  <BreadcrumbSeparator className="hidden md:block" />

                  <BreadcrumbItem>
                    <BreadcrumbPage>
                      {currentThread?.title ?? "Starter Thread"}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              {user?.email ? <SignOutButton /> : <LoginButton />}
            </header>

            <div className="flex-1 overflow-hidden">
              {activeThreadId && isLoadingMessages ? (
                <div className="flex h-full items-center justify-center text-base text-muted-foreground">
                  Loading...
                </div>
              ) : (
                <Thread />
              )}
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AssistantRuntimeProvider>
  );
};
