"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(JSON.stringify({ level: "error", event: "route_render_failed", digest: error.digest ?? null }));
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-black px-5 text-[#e7e9ea]">
      <section className="w-full max-w-lg rounded-[32px] border border-rose-500/30 bg-gradient-to-br from-slate-950 to-black p-8 text-center shadow-2xl shadow-rose-950/20">
        <AlertTriangle className="mx-auto h-10 w-10 text-rose-400" aria-hidden="true" />
        <h1 className="mt-5 text-3xl font-black tracking-tight text-white">That learning action didn’t land.</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate-400">Your account is safe. Check your connection, then try the action again. If it keeps failing, the event has been recorded for investigation.</p>
        <button onClick={reset} className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full bg-tw-blue px-6 py-3 font-black text-white transition hover:bg-sky-400">
          <RotateCcw className="h-4 w-4" aria-hidden="true" /> Try again
        </button>
      </section>
    </main>
  );
}
