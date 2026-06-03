import { auth } from "@/lib/auth";
import { getMessages } from "@/lib/db/messages";

export async function GET(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const threadId = searchParams.get("threadId");

  if (!threadId) {
    return Response.json({ error: "Missing threadId" }, { status: 400 });
  }

  const messages = await getMessages(threadId);

  return Response.json(messages);
}
