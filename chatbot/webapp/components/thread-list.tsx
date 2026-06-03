"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusIcon } from "lucide-react";
import { memo } from "react";
import type { FC } from "react";
import type { Thread } from "@/lib/hooks/use-threads";

type Props = {
  threads: Thread[];
  loading: boolean;
  activeThreadId: string | null;
  onThreadSelect: (threadId: string) => void;
  onNewThread: () => void;
};

export const ThreadList: FC<Props> = memo(function ThreadList({
  threads,
  loading,
  activeThreadId,
  onThreadSelect,
  onNewThread,
}) {
  return (
    <div className="flex flex-col gap-1">
      <Button
        variant="outline"
        onClick={onNewThread}
        className="h-8 justify-start gap-2 rounded-xl px-2 text-xs"
      >
        <PlusIcon className="size-3" />
        New Thread
      </Button>

      {loading ? (
        <ThreadListSkeleton />
      ) : (
        <div className="mt-2 flex flex-col gap-1">
          {threads.map((thread) => {
            const isActive = activeThreadId === thread.threadId;

            return (
              <button
                key={thread.threadId}
                onClick={() => onThreadSelect(thread.threadId)}
                className={`flex h-8 items-center rounded-xl px-2 text-left text-xs transition-colors ${
                  isActive ? "bg-muted" : "hover:bg-muted"
                }`}
              >
                <span className="truncate">{thread.title || "New Chat"}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});

const ThreadListSkeleton = memo(function ThreadListSkeleton() {
  return (
    <div className="flex flex-col gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex h-9 items-center px-3">
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
});
