import { Assistant } from "@/components/assistant";
import { auth } from "@/lib/auth";
import UserProvider from "@/lib/user-creds-provider";


export default async function Home() {
  const session = await auth();
  return(<>
  <UserProvider user={session?.user}>
  <Assistant />
</UserProvider>
</>)
}
