import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";
import { getGcpAccessToken } from "@/lib/gcp/auth";
import { createThread, getThread } from "@/lib/db/threads";
import { saveMessage } from "@/lib/db/messages";

const GCP_BASE_URL =
  `https://${process.env.GCP_LOCATION}-aiplatform.googleapis.com/v1beta1/` +
  `projects/${process.env.GCP_PROJECT_ID}/locations/${process.env.GCP_LOCATION}/` +
  `reasoningEngines/${process.env.GCP_REASONING_ENGINE_ID}`;

// GCP session IDs: only lowercase letters, digits, hyphens; must start/end with letter or digit
function toGcpSessionId(threadId: string): string {
  return threadId
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-") // replace invalid chars with hyphens
    .replace(/^-+|-+$/g, "") // strip leading/trailing hyphens
    .slice(0, 63); // max length
}

async function getOrCreateGcpSession(
  token: string,
  userId: string,
  threadId: string,
): Promise<string> {
  const gcpSessionId = toGcpSessionId(threadId);

  // Try to get existing session
  const getRes = await fetch(`${GCP_BASE_URL}:query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      class_method: "async_get_session",
      input: { user_id: userId, session_id: gcpSessionId },
    }),
  });

  if (getRes.ok) {
    const data = await getRes.json();
    if (data?.output?.id) return data.output.id;
  }

  // Create new session
  const createRes = await fetch(`${GCP_BASE_URL}:query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      class_method: "async_create_session",
      input: { user_id: userId, session_id: gcpSessionId },
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Failed to create GCP session: ${err}`);
  }

  const created = await createRes.json();
  return created?.output?.id ?? gcpSessionId;
}

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { threadId: incomingThreadId, message } = await req.json();

  const userId = session.user.id;

  // Ensure thread exists in local DB
  let threadId = incomingThreadId;
  if (!threadId || !(await getThread(threadId))) {
    threadId = await createThread(
      userId,
      `${message.split(" ", 10).join(" ")}...`,
    );
  }

  // Save USER message
  await saveMessage({ threadId, role: "user", content: message });

  const token = await getGcpAccessToken();

  // Resolve GCP-managed session ID
  const gcpSessionId = await getOrCreateGcpSession(token, userId, threadId);

  const payload = {
    class_method: "async_stream_query",
    input: {
      message: message,
      user_id: userId,
      session_id: gcpSessionId,
    },
  };

  const res = await fetch(`${GCP_BASE_URL}:streamQuery`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok || !res.body) {
    const errorBody = await res.text();
    console.error("GCP error:", res.status, res.statusText, errorBody);
    return new Response(`Agent request failed: ${res.status} – ${errorBody}`, {
      status: 500,
    });
  }

  // Stream response back to client
  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  let assistantText = "";
  let buffer = "";

  const stream = new ReadableStream({
    async start(controller) {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, {
          stream: true,
        });

        // forward original stream to frontend
        controller.enqueue(value);

        // parse text for DB storage
        buffer += chunk;

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();

          if (!trimmed) continue;

          try {
            const parsed = JSON.parse(trimmed);

            const text = parsed?.content?.parts?.[0]?.text ?? "";

            if (text) {
              assistantText += text;
            }
          } catch {
            // ignore malformed lines
          }
        }
      }

      await saveMessage({
        threadId,
        role: "assistant",
        content: assistantText,
      });

      controller.close();
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "x-thread-id": threadId,
    },
  });
}
