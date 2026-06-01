"use client";

import { signIn, signOut } from "next-auth/react";

function LoginButton() {
  return (
    <button
      onClick={() =>
        signIn("google", {
          redirectTo: "/",
        })
      }
    >
      Sign in with Google
    </button>
  );
}

function SignOutButton() {
  return <button onClick={() => signOut()}>Sign Out</button>;
}

export { LoginButton, SignOutButton };
