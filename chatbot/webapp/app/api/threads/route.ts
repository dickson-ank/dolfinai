import { auth } from "@/lib/auth";
import { listThreadsByUser } from "@/lib/db/threads";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const threads = await listThreadsByUser(session.user.id);

  return Response.json(threads);
}
