import { GoogleAuth } from "google-auth-library";

const CREDENTIALS = JSON.parse(
  process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON!,
);

export async function getGcpAccessToken(): Promise<string> {
  const auth = new GoogleAuth({
    credentials: CREDENTIALS,
    scopes: "https://www.googleapis.com/auth/cloud-platform",
  });

  const client = await auth.getClient();
  const token = await client.getAccessToken();

  if (!token.token) {
    throw new Error("Failed to get GCP access token");
  }

  return token.token;
}
