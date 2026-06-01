import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import {
  getIdentity,
  createIdentity,
  createUser,
} from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],

  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.provider === "google" && profile) {
        const providerId = `google#${profile.sub}`;

        // check if identity exists
        let identity = await getIdentity(providerId);

        let userId: string;

        if (!identity) {
          // create new user
          userId = await createUser({
            email: profile.email,
            name: profile.name,
            image: profile.picture,
          });

          // link identity -> user
          await createIdentity({
            providerId,
            provider: "google",
            userId,
          });
        } else {
          userId = identity.userId;
        }

        token.userId = userId;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
      }

      return session;
    },
  },
});