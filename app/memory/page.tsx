import { savePrivateLearnerNote } from "@/app/memory/actions";
import { getLearnerMemoryPageData } from "@/lib/learner-memory-queries";

export const dynamic = "force-dynamic";

export default async function LearnerMemoryPage() {
  const { summary, savedPosts, followedTutors } = await getLearnerMemoryPageData();

  return (
    <main className="min-h-screen bg-black px-5 py-8 text-[#e7e9ea]">
      <div className="mx-auto max-w-5xl">
        <a href="/" className="text-sm font-black text-tw-blue">← Back to feed</a>
        <header className="mt-5 rounded-[32px] border border-tw-border bg-gradient-to-br from-slate-950 to-black p-6">
          <div className="flex flex-wrap items-center gap-4">
            <img src={summary.avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
            <div>
              <div className="text-xs font-black uppercase tracking-[0.18em] text-tw-blue">Authenticated learner</div>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-white">Learner memory</h1>
              <p className="mt-1 text-sm font-bold text-tw-muted">{summary.name} · {summary.handle}</p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-white/[0.03] p-4">
              <div className="sr-only">{summary.savedPostCount} saved posts</div>
              <div className="text-2xl font-black text-white">{summary.savedPostCount}</div>
              <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">saved posts</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-white/[0.03] p-4">
              <div className="sr-only">{summary.followedTutorCount} followed tutors</div>
              <div className="text-2xl font-black text-white">{summary.followedTutorCount}</div>
              <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">followed tutors</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-white/[0.03] p-4">
              <div className="text-2xl font-black text-white">{summary.progressPercent}%</div>
              <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">arc progress</div>
            </div>
          </div>
          <p className="mt-4 text-sm leading-snug text-slate-400">{summary.lastSignal}</p>
        </header>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[28px] border border-tw-border bg-[#05070a] p-5">
            <h2 className="text-xl font-black text-white">Learning arc</h2>
            <p className="mt-2 text-lg font-black text-slate-100">{summary.currentArc}</p>
            <div className="mt-4 h-2 rounded-full bg-[#24282d]"><div className="h-2 rounded-full bg-gradient-to-r from-tw-blue to-emerald-500" style={{ width: `${summary.progressPercent}%` }} /></div>
            <div className="mt-4 flex flex-wrap gap-2">
              {summary.focusTopics.map((topic) => <span key={topic} className="rounded-full border border-tw-border px-3 py-1 text-xs font-black text-slate-300">{topic}</span>)}
            </div>
          </div>

          <div className="rounded-[28px] border border-tw-border bg-[#05070a] p-5">
            <h2 className="text-xl font-black text-white">Private notes</h2>
            <form action={savePrivateLearnerNote} className="mt-4 grid gap-3">
              <label className="grid gap-2 text-sm font-black text-slate-300">
                Private learning note
                <textarea name="body" rows={3} className="rounded-2xl border border-slate-800 bg-black p-3 font-medium text-white outline-none focus:border-tw-blue" placeholder="Capture a thing future tutors should remember…" />
              </label>
              <button className="w-max rounded-full bg-tw-blue px-5 py-2 text-sm font-black text-white">Save note</button>
            </form>
            <div className="mt-4 grid gap-2">
              {summary.privateNotes.length ? summary.privateNotes.map((note) => (
                <div key={note.id} className="rounded-2xl border border-slate-800 bg-white/[0.03] p-3 text-sm leading-snug text-slate-200">{note.body}</div>
              )) : <div className="rounded-2xl border border-slate-800 p-3 text-sm text-tw-muted">No private notes yet.</div>}
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[28px] border border-tw-border bg-[#05070a] p-5">
            <h2 className="text-xl font-black text-white">Followed tutors</h2>
            <div className="mt-4 grid gap-3">
              {followedTutors.map((tutor) => (
                <a key={tutor.id} href={`/tutors/${tutor.id}`} className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-white/[0.03] p-3 transition hover:bg-white/[0.06]">
                  <img src={tutor.avatarUrl} alt="" className="h-11 w-11 rounded-full object-cover" />
                  <div>
                    <div className="font-black text-white">{tutor.name}</div>
                    <div className="text-sm text-tw-muted">{tutor.profileHeadline}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-tw-border bg-[#05070a] p-5">
            <h2 className="text-xl font-black text-white">Saved posts</h2>
            <div className="mt-4 grid gap-3">
              {savedPosts.map((post) => (
                <div key={post.id} className="rounded-2xl border border-slate-800 bg-white/[0.03] p-3">
                  <div className="text-xs font-black uppercase tracking-[0.14em] text-tw-blue">{post.tutorName}</div>
                  <p className="mt-1 line-clamp-3 text-sm leading-snug text-slate-200">{post.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
