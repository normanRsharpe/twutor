"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth/client";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { getSafeRedirectPath } from "@/lib/auth/redirects";

export function AuthForm({ mode, nextPath = "/" }: { mode: "sign-in" | "sign-up"; nextPath?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const isSignUp = mode === "sign-up";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const name = String(formData.get("name") ?? "").trim();

    const result = isSignUp
      ? await authClient.signUp.email({ email, password, name })
      : await authClient.signIn.email({ email, password });

    if (result.error) {
      setError(getAuthErrorMessage(result.error.code));
      setPending(false);
      return;
    }

    router.replace(getSafeRedirectPath(nextPath, window.location.origin));
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-8 grid gap-5">
      {isSignUp ? (
        <label className="grid gap-2 text-sm font-black text-slate-300">
          Name
          <input name="name" autoComplete="name" required className="rounded-2xl border border-slate-800 bg-black px-4 py-3 font-medium text-white outline-none transition focus:border-tw-blue" placeholder="Ada Learner" />
        </label>
      ) : null}
      <label className="grid gap-2 text-sm font-black text-slate-300">
        Email
        <input name="email" type="email" autoComplete="email" required className="rounded-2xl border border-slate-800 bg-black px-4 py-3 font-medium text-white outline-none transition focus:border-tw-blue" placeholder="you@example.com" />
      </label>
      <label className="grid gap-2 text-sm font-black text-slate-300">
        Password
        <input name="password" type="password" minLength={8} autoComplete={isSignUp ? "new-password" : "current-password"} required className="rounded-2xl border border-slate-800 bg-black px-4 py-3 font-medium text-white outline-none transition focus:border-tw-blue" placeholder="At least 8 characters" />
      </label>
      {error ? <div role="alert" className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm font-bold text-rose-100">{error}</div> : null}
      <button disabled={pending} className="rounded-full bg-tw-blue px-5 py-3 font-black text-white transition hover:bg-sky-400 disabled:cursor-wait disabled:opacity-60">
        {pending ? "Opening your feed…" : isSignUp ? "Create account" : "Sign in"}
      </button>
    </form>
  );
}
