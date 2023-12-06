import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { type GetServerSidePropsContext } from "next";
import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";

import { db } from "@/server/db";
import { compareSync } from "bcrypt";
import { env } from "@/env";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
// declare Session to have an id
declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** User CUID. */
      id: string;
    } & DefaultSession["user"];
    accessToken: string;
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */

export const authOptions: NextAuthOptions = {
  secret: env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(db),
  session: {
    // Cookies sessions does not work with credentials provider
    // https://stackoverflow.com/questions/72090328/next-auth-credentials-not-returning-session-and-not-storing-session-and-account
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 30 Days
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    CredentialsProvider({
      // The name to display on the sign in form (e.g. "Sign in with...")
      name: "Credentials",
      // `credentials` is used to generate a form on the sign in page.
      // You can specify which fields should be submitted, by adding keys to the `credentials` object.
      // e.g. domain, username, password, 2FA token, etc.
      // You can pass any HTML attribute to the <input> tag through the object.
      credentials: {
        username: { label: "Username", type: "text", placeholder: "jsmith" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        // Add logic here to look up the user from the credentials supplied
        if (!credentials) {
          return null;
        }

        const user = await db.user.findUnique({
          where: {
            email: credentials.username,
          },
          include: {
            CredentialPassword: true,
          },
        });

        if (!user) {
          return null;
        }

        if (!user.CredentialPassword) {
          // LOG AN ERROR HERE!
          return null;
        }

        const inputPassword = credentials.password;
        const dbHashedPassword = user.CredentialPassword.password;

        const isPasswordValid = compareSync(inputPassword, dbHashedPassword);

        if (!isPasswordValid) {
          return null;
        }

        const userJWT = { id: user.id, name: user.name, email: user.email };

        return userJWT;
      },
    }),
    GithubProvider({
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    }),
    // ...add more providers here
  ],
  callbacks: {
    async jwt(jwt) {
      // Persist the OAuth access_token to the token right after signin
      if (jwt.account) {
        jwt.token.accessToken = jwt.account.access_token;
      }
      // Add additional properties to the JWT
      if (jwt.user) {
        jwt.token.metadata = jwt.user;
      }
      return jwt.token;
    },
    async session(sess) {
      // Send properties to the client, like an access_token from a provider.
      sess.session.accessToken = (sess.token.accessToken as string) ?? "";
      // Add addtional properties to the session object.
      sess.session.user = {
        ...sess.session.user,
        ...(sess.token.metadata as Map<string, string>),
      };
      return sess.session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext["req"];
  res: GetServerSidePropsContext["res"];
}) => {
  return getServerSession(ctx.req, ctx.res, authOptions);
};
