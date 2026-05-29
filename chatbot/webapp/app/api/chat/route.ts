import { NextRequest } from "next/server";

const API_SECRET = process.env.API_SECRET!;
const PROJECT_ID = process.env.GOOGLE_PROJECT_ID!;
const LOCATION = process.env.GOOGLE_LOCATION!;
const AGENT_ID = process.env.GOOGLE_AGENT_ID!;

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-api-secret");
  if (secret !== API_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { message } = await req.json();
  if (!message || typeof message !== "string") {
    return new Response("Bad Request", { status: 400 });
  }

  try {
    const { SessionsClient } = await import("@google-cloud/dialogflow-cx");

    const credentials = JSON.parse(
      process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON!,
    );

    const client = new SessionsClient({
      apiEndpoint: `${LOCATION}-dialogflow.googleapis.com`,
      credentials,
    });

    const sessionId = crypto.randomUUID();
    const sessionPath = client.projectLocationAgentSessionPath(
      PROJECT_ID,
      LOCATION,
      AGENT_ID,
      sessionId,
    );

    const [response] = await client.detectIntent({
      session: sessionPath,
      queryInput: {
        text: {
          text: message,
        },
        languageCode: "en",
      },
    });

    const replyText =
      response.queryResult?.responseMessages
        ?.map((msg) => msg.text?.text?.join(" "))
        .filter(Boolean)
        .join("\n") ?? "I could not process that request.";

    return Response.json({
      id: crypto.randomUUID(),
      role: "assistant",
      content: replyText,
    });
  } catch (err) {
    console.error("Vertex AI error:", err);
    return new Response("Agent error", { status: 502 });
  }
}
