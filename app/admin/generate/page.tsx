import { generateContentDraftAction, publishContentDraftAction, reviewContentDraftAction } from "@/app/admin/generate/actions";
import { getGeneratedContentAdminData } from "@/lib/generated-content-queries";
import { requireAdminLearner } from "@/lib/auth/server";
import { getTutorResponseLabel } from "@/lib/ask-tutors";

export const dynamic = "force-dynamic";

export default async function GeneratedContentAdminPage() {
  const learner = await requireAdminLearner();

  const { rows, briefOptions } = await getGeneratedContentAdminData(learner.id);

  return (
    <main className="min-h-screen bg-black px-5 py-8 text-[#e7e9ea]">
      <div className="mx-auto max-w-6xl">
        <a href="/" className="text-sm font-black text-tw-blue">← Back to feed</a>
        <header className="mt-5 rounded-[32px] border border-slate-800 bg-gradient-to-br from-slate-950 to-black p-6">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-tw-blue">Dev admin · provider-aware AI</div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Generated content pipeline</h1>
          <p className="mt-2 max-w-2xl text-sm leading-snug text-slate-400">Generate a tutor draft, inspect provider and prompt metadata, then publish it into the feed only after review.</p>
          <form action={generateContentDraftAction} className="mt-5 grid gap-3 rounded-3xl border border-slate-800 bg-black p-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-black text-slate-300">
              Draft theme
              <input name="theme" className="rounded-full border border-slate-700 bg-black px-4 py-2 font-medium text-white outline-none focus:border-tw-blue" placeholder="Model gateway launch checklist" />
            </label>
            <label className="grid gap-2 text-sm font-black text-slate-300">
              Format
              <select name="kind" defaultValue="diagram" className="rounded-full border border-slate-700 bg-black px-4 py-2 font-medium text-white outline-none focus:border-tw-blue">
                <option value="diagram">diagram</option>
                <option value="text">text</option>
                <option value="poll">poll</option>
                <option value="challenge">challenge</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-black text-slate-300 md:col-span-2">
              Content brief
              {briefOptions.length ? (
                <select name="sourceBriefId" required className="rounded-2xl border border-slate-700 bg-black px-4 py-3 font-medium text-white outline-none focus:border-tw-blue">
                  <option value="">Choose reviewed research…</option>
                  {briefOptions.map((brief) => <option key={brief.value} value={brief.value}>{brief.label} — {brief.description}</option>)}
                </select>
              ) : <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 font-medium text-amber-100">No active content briefs yet. Create or activate a research brief before generating feed candidates.</div>}
            </label>
            <button disabled={!briefOptions.length} className="self-end rounded-full bg-tw-blue px-5 py-2 font-black text-white disabled:cursor-not-allowed disabled:opacity-40 md:col-span-2">Generate 2 candidates</button>
          </form>
        </header>

        <section className="mt-5 grid gap-5">
          {rows.length ? rows.map((draft) => (
            <article key={draft.id} className="rounded-[28px] border border-slate-800 bg-[#05070a] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img src={draft.tutorAvatarUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
                  <div>
                    <h2 className="text-xl font-black text-white">{draft.theme}</h2>
                    <div className="text-sm font-bold text-slate-500">{draft.tutorName} · {draft.kind}</div>
                  </div>
                </div>
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-200">{draft.status === "draft" ? getTutorResponseLabel(draft) : draft.status}</span>
              </div>
              <p className="mt-4 whitespace-pre-line rounded-2xl border border-slate-800 bg-white/[0.03] p-4 text-sm leading-snug text-slate-100">{draft.body}</p>
              <details className="mt-4 rounded-2xl border border-slate-800 p-3 text-xs text-tw-muted" open>
                <summary className="cursor-pointer font-black text-slate-300">Prompt metadata retained</summary>
                <pre className="mt-2 whitespace-pre-wrap break-words">provider={draft.provider}{"\n"}model={draft.model}{"\n"}metadata={JSON.stringify(draft.metadata)}{"\n\n"}{draft.prompt}</pre>
              </details>
              {draft.status === "draft" ? (
                <div className="mt-4 grid gap-3">
                  <form action={reviewContentDraftAction} className="grid gap-2 rounded-2xl border border-slate-800 p-3">
                    <input type="hidden" name="draftId" value={draft.id} />
                    <input name="revisionReason" className="rounded-full border border-slate-700 bg-black px-4 py-2 text-sm" placeholder="Review or revision reason" />
                    <div className="flex gap-2"><button name="decision" value="approved" className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-black text-black">Approve</button><button name="decision" value="rejected" className="rounded-full border border-rose-500 px-4 py-2 text-sm font-black text-rose-200">Reject</button></div>
                  </form>
                  {draft.publishErrors.length ? <div className="text-xs text-amber-200">{draft.publishErrors.join(" · ")}</div> : null}
                <form action={publishContentDraftAction}>
                  <input type="hidden" name="draftId" value={draft.id} />
                  <button disabled={draft.publishBlocked} className="rounded-full bg-white px-5 py-2 text-sm font-black text-black disabled:opacity-40">Publish to feed</button>
                </form></div>
              ) : (
                <div className="mt-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm font-bold text-emerald-100">Published to feed as {draft.publishedPostId}</div>
              )}
            </article>
          )) : (
            <div className="rounded-[28px] border border-slate-800 bg-[#05070a] p-8 text-center text-tw-muted">No generated drafts yet.</div>
          )}
        </section>
      </div>
    </main>
  );
}
