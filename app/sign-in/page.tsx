import { AuthForm } from "@/components/auth-form";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center bg-black px-5 py-10 text-[#e7e9ea]">
      <section className="w-full max-w-md rounded-[32px] border border-tw-border bg-gradient-to-br from-slate-950 to-black p-7 shadow-2xl shadow-sky-950/20">
        <a href="/" className="text-[32px] font-black tracking-[-0.08em]">twut<span className="text-tw-blue">or</span></a>
        <div className="mt-8 text-xs font-black uppercase tracking-[0.18em] text-tw-blue">Your learning feed</div>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Welcome back</h1>
        <p className="mt-2 text-sm leading-snug text-slate-400">Sign in to return to your tutors, saved models, and learning memory.</p>
        <AuthForm mode="sign-in" nextPath={next} />
        <p className="mt-6 text-center text-sm text-tw-muted">New to Twutor? <a className="font-black text-tw-blue" href="/sign-up">Create an account</a></p>
      </section>
    </main>
  );
}
