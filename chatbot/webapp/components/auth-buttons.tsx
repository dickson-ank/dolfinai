"use client";

import { signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

function LoginButton() {
  return (
    <Button
    variant="outline"
      className="rounded-xl p-2 text-white text-xs"
      onClick={() =>
        signIn("google", {
          redirectTo: "/",
        })
      }
    >
      Sign in with Google
    </Button>
  );
}

function SignOutButton() {
  return (
    <Button variant="destructive" 
    className="rounded-xl p-2 text-xs"
    onClick={() => signOut()}>
      Sign Out
    </Button>
  );
}

export { LoginButton, SignOutButton };
