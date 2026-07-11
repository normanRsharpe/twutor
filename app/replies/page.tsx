import { createAskTutorThreadFromQuestion, listAskTutorThreads, type AskTutorThreadView } from "@/lib/ask-tutor-queries";
import { getTutorResponseLabel, getTutorResponseMetadataSummary } from "@/lib/ask-tutors";
import { localDemoModeEnabled, requireCurrentLearner } from "@/lib/auth/server";
import { getDatabaseUrl } from "@/lib/db/client";

export const dynamic = "force-dynamic";

function normalizeSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TutorRepliesPage({ searchParams }: { searchParams: Promise<{ thread?: string | string[]; question?: string | string[] }> }) {
  const learner = await requireCurrentLearner();
  const params = await searchParams;
  const localQuestion = localDemoModeEnabled() && !getDatabaseUrl() ? normalizeSearchValue(params.question)?.trim() : undefined;
  const localThread = localQuestion ? await createAskTutorThreadFromQuestion(localQuestion, learner.id) : null;
  const selectedThreadId = localThread?.id ?? normalizeSearchValue(params.thread)?.trim();
  const storedThreads = await listAskTutorThreads(learner.id);
  const threads: AskTutorThreadView[] = selectedThreadId
    ? [
        ...storedThreads.filter((thread) => thread.id === selectedThreadId),
        ...storedThreads.filter((thread) => thread.id !== selectedThreadId)
      ]
    : storedThreads;

  return (
    <main className="min-h-screen bg-black px-5 py-8 text-[#e7e9ea]">
      <div className="mx-auto max-w-4xl">
        <a href="/" className="text-sm font-black text-tw-blue">← Back to feed</a>
        <header className="mt-5 rounded-[32px] border border-tw-border bg-gradient-to-br from-slate-950 to-black p-6">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-tw-blue">Ask Tutors</div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Tutor Replies</h1>
          <p className="mt-2 max-w-2xl text-sm leading-snug text-slate-400">Questions become reviewable tutor threads with provider-aware status, guardrails, and a follow-up affordance before anything turns into a public post.</p>
        </header>

        <section className="mt-5 grid gap-5">
          {threads.length ? threads.map((thread) => (
            <article key={thread.id} className="rounded-[28px] border border-tw-border bg-[#05070a] p-5">
              <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Learner question</div>
              <h2 className="mt-2 text-2xl font-black leading-tight text-white">{thread.question}</h2>
              <div className="mt-5 grid gap-4">
                {thread.responses.map((response) => (
                  <section key={response.id} className="rounded-3xl border border-slate-800 bg-white/[0.03] p-4">
                    <div className="flex items-center gap-3">
                      {response.tutorAvatarUrl ? <img src={response.tutorAvatarUrl} alt="" className="h-12 w-12 rounded-full object-cover" /> : null}
                      <div>
                        <div className="font-black text-white">{response.tutorName}</div>
                        <div className="text-sm text-tw-muted">{response.tutorHandle} · {response.status}</div>
                      </div>
                      <span className="ml-auto rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-200">{getTutorResponseLabel(response)}</span>
                    </div>
                    <p className="mt-4 whitespace-pre-line text-[16px] leading-snug text-slate-100">{response.body}</p>
                    <div className="mt-4 rounded-2xl border border-slate-800 bg-black p-3">
                      <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Guardrails</div>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
                        {response.guardrails.map((guardrail) => <li key={guardrail}>{guardrail}</li>)}
                      </ul>
                    </div>
                    <div className="mt-4 rounded-2xl border border-tw-blue/40 bg-tw-blue/10 p-3 text-sm font-bold text-sky-100">{response.followUpPrompt}</div>
                    <details className="mt-3 rounded-2xl border border-slate-800 p-3 text-xs text-tw-muted">
                      <summary className="cursor-pointer font-black text-slate-300">Prompt metadata retained</summary>
                      <pre className="mt-2 whitespace-pre-wrap break-words">provider={response.provider}\nmodel={response.model}\nmetadata={JSON.stringify(getTutorResponseMetadataSummary(response.metadata))}\n\n{response.prompt}</pre>
                    </details>
                  </section>
                ))}
              </div>
            </article>
          )) : (
            <div className="rounded-[28px] border border-tw-border bg-[#05070a] p-8 text-center text-tw-muted">Ask from the Home composer to create your first tutor thread.</div>
          )}
        </section>
      </div>
    </main>
  );
}
