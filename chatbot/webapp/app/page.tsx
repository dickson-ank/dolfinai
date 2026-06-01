import { Assistant } from "./assistant";
import { auth } from "@/lib/auth";

import { LoginButton, SignOutButton } from "@/components/auth-buttons";

export default async function Home() {
  const session = await auth();
  console.log("Session:", session);
  return <Assistant />;
}
