"use client";

import { createContext, useContext } from "react";
import { User } from "next-auth";

type UserWithId = ({ id: string } & User) | null | undefined;

const UserContext = createContext<UserWithId>(null);

interface UserProviderProps {
  user: UserWithId;
  children: React.ReactNode;
}

export default function UserProvider({ user, children }: UserProviderProps) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext) as UserWithId;
}
