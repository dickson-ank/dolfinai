"use client";

import { useEffect, useState } from "react";

export interface Thread {
  threadId: string;
  title: string;
  updatedAt: string;
}

export interface UseThreadsResult {
  threads: Thread[];
  setThreads: React.Dispatch<React.SetStateAction<Thread[]>>;
  loading: boolean;
  reloadThreads: () => Promise<void>;
}

export function useThreads(): UseThreadsResult {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadThreads = async (): Promise<void> => {
    setLoading(true);
    const res = await fetch("/api/threads");
    const data = (await res.json()) as Thread[];

    data.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() -
        new Date(a.updatedAt).getTime(),
    );

    setThreads(data);
    setLoading(false);
  };

  useEffect(() => {
    loadThreads();
  }, []);

  return {
    threads,
    setThreads,
    loading,
    reloadThreads: loadThreads,
  };
}
