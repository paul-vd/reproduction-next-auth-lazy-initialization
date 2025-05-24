import NextAuth, { NextAuthConfig } from "next-auth";
import "next-auth/jwt";

// import Atlassian from "next-auth/providers/atlassian"
import { UnstorageAdapter } from "@auth/unstorage-adapter";
import Passkey from "next-auth/providers/passkey";
import { createStorage } from "unstorage";
import memoryDriver from "unstorage/drivers/memory";

const storage = createStorage({
  driver: memoryDriver(),
});

const authConfig: NextAuthConfig = {
  debug: !!process.env.AUTH_DEBUG,
  theme: { logo: "https://authjs.dev/img/logo-sm.png" },
  adapter: UnstorageAdapter(storage),
  providers: [
    Passkey({
      formFields: {
        email: {
          label: "Username",
          required: true,
          autocomplete: "username webauthn",
        },
      },
    }),
  ],
  basePath: "/auth",
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ request, auth }) {
      const { pathname } = request.nextUrl;
      if (pathname === "/middleware-example") return !!auth;
      return true;
    },
    jwt({ token, trigger, session, account }) {
      if (trigger === "update") token.name = session.user.name;
      if (account?.provider === "keycloak") {
        return { ...token, accessToken: account.access_token };
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.accessToken) session.accessToken = token.accessToken;

      return session;
    },
  },
  experimental: { enableWebAuthn: true },
};

export const { handlers, auth, signIn, signOut } = NextAuth((req) => {
  console.log(">>>>", req);

  return authConfig;
});

declare module "next-auth" {
  interface Session {
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
  }
}
