import { Assistant } from "@/components/assistant";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;

  return <Assistant initialThreadId={threadId} />;
}
