"use client";

import { signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

function LoginButton() {
  return (
    <button
      className="rounded-xl p-1 text-background text-xs bg-foreground/90 border border-2 ml-3"
      onClick={() =>
        signIn("google", {
          redirectTo: "/",
        })
      }
    >
      Sign In
    </button>
  );
}

function SignOutButton() {
  return (
    <button
      className="rounded-xl p-1 text-xs text-background bg-foreground/90 border border-2 ml-3"
      onClick={() => signOut()}
    >
      Sign Out
    </button>
  );
}

export { LoginButton, SignOutButton };
