import { notFound } from "next/navigation";
import { publishAgenticIntentAction, retireAgenticIntentAction } from "@/app/admin/intents/actions";
import { isAgenticIntentsAdminEnabled, type AgenticIntentAdminRow } from "@/lib/admin-intents";
import { getAgenticIntentAdminData } from "@/lib/admin-intent-queries";

export const dynamic = "force-dynamic";

const statusStyles: Record<AgenticIntentAdminRow["status"], string> = {
  planned: "border-sky-500/50 bg-sky-500/10 text-sky-200",
  published: "border-emerald-500/50 bg-emerald-500/10 text-emerald-200",
  retired: "border-slate-600 bg-slate-800 text-slate-300"
};

function pill(label: string) {
  return <span key={label} className="rounded-full border border-slate-700 bg-white/[0.03] px-2.5 py-1 text-xs font-black text-slate-300">{label}</span>;
}

function AdminActionForms({ intent }: { intent: AgenticIntentAdminRow }) {
  if (intent.status === "retired") {
    return <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 text-sm font-bold text-slate-500">Retired from the review queue.</div>;
  }

  return (
    <div className="grid gap-3 md:grid-cols-[1fr_auto]">
      {intent.status === "planned" ? (
        <form action={publishAgenticIntentAction} className="flex flex-col gap-2 rounded-2xl border border-slate-800 bg-slate-950 p-3 md:flex-row">
          <input type="hidden" name="intentId" value={intent.id} />
          <input
            name="publishedPostId"
            defaultValue={intent.publishedPostId ?? ""}
            placeholder="published post id"
            className="min-w-0 flex-1 rounded-full border border-slate-700 bg-black px-3 py-2 text-sm font-bold text-white outline-none focus:border-tw-blue"
          />
          <button className="rounded-full bg-tw-blue px-4 py-2 text-sm font-black text-white transition hover:bg-sky-400">Publish link</button>
        </form>
      ) : (
        <div className="rounded-2xl border border-emerald-800 bg-emerald-950/30 p-3 text-sm font-bold text-emerald-200">Linked to {intent.publishedPostId}</div>
      )}
      <form action={retireAgenticIntentAction}>
        <input type="hidden" name="intentId" value={intent.id} />
        <button className="h-full rounded-full border border-rose-500/50 px-4 py-2 text-sm font-black text-rose-200 transition hover:bg-rose-500/10">Retire</button>
      </form>
    </div>
  );
}

function IntentCard({ intent }: { intent: AgenticIntentAdminRow }) {
  return (
    <article className="rounded-[28px] border border-slate-800 bg-[#05070a] p-5 shadow-2xl shadow-black/20">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {intent.tutorAvatarUrl ? <img src={intent.tutorAvatarUrl} alt="" className="h-12 w-12 rounded-full object-cover" /> : null}
          <div>
            <h2 className="text-lg font-black text-white">{intent.tutorName}</h2>
            <div className="text-sm font-bold text-slate-500">{intent.tutorHandle} · {intent.suggestedPostKind}</div>
          </div>
        </div>
        <div className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${statusStyles[intent.status]}`}>{intent.status}</div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {pill(intent.feedMove)}
        {pill(intent.noveltyLevel)}
        {intent.targetConceptSlugs.map(pill)}
      </div>

      <div className="mt-4 rounded-2xl border border-slate-800 bg-white/[0.03] p-4">
        <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Brief</div>
        <div className="mt-1 font-black text-slate-100">{intent.briefTheme}</div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <section className="rounded-2xl border border-slate-800 bg-white/[0.03] p-4">
          <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Landing hypothesis</div>
          <p className="mt-2 text-sm leading-snug text-slate-200">{intent.landingHypothesis}</p>
        </section>
        <section className="rounded-2xl border border-slate-800 bg-white/[0.03] p-4">
          <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Expected learner effect</div>
          <p className="mt-2 text-sm leading-snug text-slate-200">{intent.expectedLearnerEffect}</p>
        </section>
        <section className="rounded-2xl border border-slate-800 bg-white/[0.03] p-4">
          <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Voice notes</div>
          <p className="mt-2 text-sm leading-snug text-slate-200">{intent.voiceNotes}</p>
        </section>
        <section className="rounded-2xl border border-rose-900/70 bg-rose-950/20 p-4">
          <div className="text-xs font-black uppercase tracking-[0.14em] text-rose-300">Risk notes</div>
          <p className="mt-2 text-sm leading-snug text-rose-100">{intent.riskNotes}</p>
        </section>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 p-3 text-sm text-slate-300"><span className="font-black text-white">Seen</span> {intent.expectedSeenProbability}% expected</div>
        <div className="rounded-2xl border border-slate-800 p-3 text-sm text-slate-300"><span className="font-black text-white">Save</span> {intent.expectedSaveProbability}% expected</div>
        <div className="rounded-2xl border border-slate-800 p-3 text-sm text-slate-300"><span className="font-black text-white">Signals</span> {Object.entries(intent.signalCounts).map(([key, count]) => `${key}:${count}`).join(" · ") || "none yet"}</div>
      </div>

      {intent.publishErrors.length ? <div className="mt-4 rounded-2xl border border-amber-600/50 bg-amber-950/20 p-3 text-sm font-bold text-amber-100">Publish guard: {intent.publishErrors.join(" · ")}</div> : null}
      <div className="mt-4"><AdminActionForms intent={intent} /></div>
    </article>
  );
}

export default async function AgenticIntentsAdminPage() {
  if (!isAgenticIntentsAdminEnabled()) notFound();

  const { rows, counts } = await getAgenticIntentAdminData();

  return (
    <main className="min-h-screen bg-black px-5 py-8 text-[#e7e9ea]">
      <div className="mx-auto max-w-6xl">
        <a href="/" className="text-sm font-black text-tw-blue">← Back to feed</a>
        <header className="mt-5 rounded-[32px] border border-slate-800 bg-gradient-to-br from-slate-950 to-black p-6">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-tw-blue">Dev admin · guarded route</div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Agentic post intents</h1>
          <p className="mt-2 max-w-2xl text-sm leading-snug text-slate-400">Review the feed moves Twutor is planning before anything becomes a learner-facing post. This stays tiny on purpose: inspect hypothesis, voice, risk, and lifecycle state.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {Object.entries(counts).map(([status, count]) => (
              <div key={status} className="rounded-2xl border border-slate-800 bg-white/[0.03] p-4">
                <div className="text-2xl font-black text-white">{count}</div>
                <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{status}</div>
              </div>
            ))}
          </div>
        </header>
        <section className="mt-5 grid gap-5">
          {rows.map((intent) => <IntentCard key={intent.id} intent={intent} />)}
        </section>
      </div>
    </main>
  );
}
