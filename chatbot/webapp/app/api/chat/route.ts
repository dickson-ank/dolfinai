import { NextRequest } from "next/server";
import { GoogleAuth } from "google-auth-library";

// const API_SECRET = process.env.API_SECRET!;
const AGENT_RESOURCE = process.env.GOOGLE_AGENT_RESOURCE!;
const CREDENTIALS = JSON.parse(
  process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON!,
);

async function getToken(): Promise<string> {
  const auth = new GoogleAuth({
    credentials: CREDENTIALS,
    scopes: "https://www.googleapis.com/auth/cloud-platform",
  });
  const token = await auth.getAccessToken();
  if (!token) throw new Error("Failed to get access token");
  return token;
}

async function createSession(
  location: string,
  userId: string,
  token: string,
): Promise<string> {
  const res = await fetch(
    `https://${location}-aiplatform.googleapis.com/v1beta1/${AGENT_RESOURCE}:query`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        class_method: "create_session",
        input: { user_id: userId },
      }),
    },
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Session creation failed: ${err}`);
  }

  const data = await res.json();
  return data.output?.id ?? data.id ?? data.name?.split("/").pop();
}

export async function POST(req: NextRequest) {
  // const secret = req.headers.get("x-api-secret");
  // if (secret !== API_SECRET) {
  //   return new Response("Unauthorized", { status: 401 });
  // }

  const body = await req.json();
  const { message, userId } = body;

  if (!message || typeof message !== "string") {
    return new Response("Bad Request", { status: 400 });
  }

  try {
    const location = AGENT_RESOURCE.split("/")[3];
    const resolvedUserId = userId ?? "anonymous";
    const token = await getToken();

    const sessionId = await createSession(location, resolvedUserId, token);

    const res = await fetch(
      `https://${location}-aiplatform.googleapis.com/v1beta1/${AGENT_RESOURCE}:streamQuery?alt=sse`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          class_method: "async_stream_query",
          input: {
            user_id: resolvedUserId,
            session_id: sessionId,
            message,
          },
        }),
      },
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("Agent Engine error:", err);
      return new Response(`Agent error: ${err}`, { status: 502 });
    }

    const text = await res.text();

    // Agent returns newline-delimited JSON objects — parse each line
    // and find the final model response
    const lines = text.trim().split("\n");

    let replyText = "";

    for (const line of lines) {
      const clean = line.replace(/^data:\s*/, "").trim();
      if (!clean) continue;
      try {
        const event = JSON.parse(clean);
        // pick the last model text turn
        if (event?.content?.role === "model") {
          const parts: string[] = (event.content.parts ?? [])
            .map((p: any) => p?.text)
            .filter(Boolean);
          if (parts.length) replyText = parts.join("");
        }
      } catch {
        // skip unparseable lines
      }
    }

    return Response.json({
      id: crypto.randomUUID(),
      role: "assistant",
      content: replyText || "I could not process that request.",
    });
  } catch (err) {
    console.error("Route error:", err);
    return new Response(`Agent error: ${err}`, { status: 502 });
  }
}
