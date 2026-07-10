import { generateContentDraftAction, publishContentDraftAction } from "@/app/admin/generate/actions";
import { getGeneratedContentAdminData } from "@/lib/generated-content-queries";
import { requireAdminLearner } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function GeneratedContentAdminPage() {
  await requireAdminLearner();

  const { rows } = await getGeneratedContentAdminData();

  return (
    <main className="min-h-screen bg-black px-5 py-8 text-[#e7e9ea]">
      <div className="mx-auto max-w-6xl">
        <a href="/" className="text-sm font-black text-tw-blue">← Back to feed</a>
        <header className="mt-5 rounded-[32px] border border-slate-800 bg-gradient-to-br from-slate-950 to-black p-6">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-tw-blue">Dev admin · mocked OpenAI</div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Generated content pipeline</h1>
          <p className="mt-2 max-w-2xl text-sm leading-snug text-slate-400">Generate a tutor draft with mocked OpenAI, inspect prompt metadata, then publish it into the feed only after review.</p>
          <form action={generateContentDraftAction} className="mt-5 grid gap-3 rounded-3xl border border-slate-800 bg-black p-4 md:grid-cols-[1fr_180px_auto]">
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
            <button className="self-end rounded-full bg-tw-blue px-5 py-2 font-black text-white">Generate draft</button>
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
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-200">{draft.status === "draft" ? "Mocked OpenAI draft" : draft.status}</span>
              </div>
              <p className="mt-4 whitespace-pre-line rounded-2xl border border-slate-800 bg-white/[0.03] p-4 text-sm leading-snug text-slate-100">{draft.body}</p>
              <details className="mt-4 rounded-2xl border border-slate-800 p-3 text-xs text-tw-muted" open>
                <summary className="cursor-pointer font-black text-slate-300">Prompt metadata retained</summary>
                <pre className="mt-2 whitespace-pre-wrap break-words">provider={draft.provider}{"\n"}model={draft.model}{"\n"}metadata={JSON.stringify(draft.metadata)}{"\n\n"}{draft.prompt}</pre>
              </details>
              {draft.status === "draft" ? (
                <form action={publishContentDraftAction} className="mt-4">
                  <input type="hidden" name="draftId" value={draft.id} />
                  <button className="rounded-full bg-white px-5 py-2 text-sm font-black text-black">Publish to feed</button>
                </form>
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
