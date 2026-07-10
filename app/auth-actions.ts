"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth/auth";
import { localDemoModeEnabled } from "@/lib/auth/server";

export async function signOut() {
  if (!localDemoModeEnabled()) {
    await getAuth().api.signOut({ headers: await headers() });
  }
  redirect("/sign-in");
}
