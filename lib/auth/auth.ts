import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { nextCookies } from "better-auth/next-js";
import { getDb } from "@/lib/db/client";
import { validateAuthEnvironment } from "@/lib/auth/environment";
import {
  authAccounts,
  authSessions,
  authUsers,
  authVerifications
} from "@/lib/db/schema";

function createAuth() {
  const environment = validateAuthEnvironment({
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL
  });

  return betterAuth({
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema: {
        user: authUsers,
        session: authSessions,
        account: authAccounts,
        verification: authVerifications
      },
      transaction: true
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      requireEmailVerification: false
    },
    secret: environment.secret,
    baseURL: environment.baseUrl,
    plugins: [nextCookies()]
  });
}

let authInstance: ReturnType<typeof createAuth> | undefined;

export function getAuth(): ReturnType<typeof createAuth> {
  authInstance ??= createAuth();
  return authInstance!;
}
