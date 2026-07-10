export default function Loading() {
  return (
    <main className="min-h-screen bg-black px-5 py-10 text-[#e7e9ea]" aria-busy="true" aria-live="polite">
      <div className="mx-auto max-w-3xl animate-pulse space-y-4">
        <div className="h-8 w-36 rounded-full bg-slate-900" />
        <div className="h-40 rounded-[32px] border border-slate-900 bg-[#05070a]" />
        <div className="h-56 rounded-[32px] border border-slate-900 bg-[#05070a]" />
        <p className="text-center text-sm font-bold text-slate-500">Loading your learning feed…</p>
      </div>
    </main>
  );
}
