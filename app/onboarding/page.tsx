import { redirect } from "next/navigation";
import { submitOnboarding } from "@/app/onboarding/actions";
import { requireCurrentLearner } from "@/lib/auth/server";
import { getLearnerOnboarding } from "@/lib/onboarding-queries";

const topics = ["LLM evals", "Observability", "RAG systems", "Model gateways", "Agent workflows"];
const tutors = [
  ["maya", "Maya", "AI systems"],
  ["eval", "Eval", "LLM evaluation"],
  ["nora", "Nora", "Platform reliability"],
  ["kai", "Kai", "Agent systems"],
  ["lin", "Lin", "Retrieval"],
  ["priya", "Priya", "Product systems"]
];

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const learner = await requireCurrentLearner();
  if (await getLearnerOnboarding(learner.id)) redirect("/");

  return <main className="min-h-screen bg-black px-5 py-10 text-[#e7e9ea]"><form action={submitOnboarding} className="mx-auto max-w-3xl space-y-6">
    <header className="rounded-[32px] border border-tw-border bg-gradient-to-br from-slate-950 to-black p-7"><div className="text-xs font-black uppercase tracking-[.18em] text-tw-blue">Welcome, {learner.name}</div><h1 className="mt-2 text-4xl font-black">Build your first learning arc.</h1><p className="mt-3 max-w-xl text-slate-400">No fake progress. Pick a direction and Twutor will start clean, then earn its understanding from what you do.</p></header>
    <section className="rounded-[28px] border border-tw-border bg-[#05070a] p-6"><label className="grid gap-2 font-black">What are you here to build?<input required name="goal" placeholder="Ship reliable AI systems" className="rounded-2xl border border-slate-800 bg-black p-3 font-medium" /></label><div className="mt-5 grid gap-3 sm:grid-cols-3">{["new", "building", "shipping"].map((level) => <label key={level} className="cursor-pointer rounded-2xl border border-slate-800 p-4"><input name="level" type="radio" value={level} defaultChecked={level === "building"} /> <span className="ml-2 font-black capitalize">{level}</span></label>)}</div></section>
    <section className="rounded-[28px] border border-tw-border bg-[#05070a] p-6"><h2 className="text-xl font-black">Choose a few starting topics</h2><div className="mt-4 flex flex-wrap gap-3">{topics.map((topic) => <label key={topic} className="cursor-pointer rounded-full border border-slate-700 px-4 py-2 text-sm font-bold"><input name="topics" type="checkbox" value={topic} className="mr-2" />{topic}</label>)}</div></section>
    <section className="rounded-[28px] border border-tw-border bg-[#05070a] p-6"><h2 className="text-xl font-black">Who should show up first?</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{tutors.map(([id, name, specialty]) => <label key={id} className="cursor-pointer rounded-2xl border border-slate-800 p-4"><input name="tutors" type="checkbox" value={id} className="mr-2" /><span className="font-black">{name}</span><span className="ml-2 text-sm text-tw-muted">{specialty}</span></label>)}</div></section>
    <section className="rounded-[28px] border border-tw-border bg-[#05070a] p-6"><label className="grid gap-2 font-black">Your pace<select name="cadence" defaultValue="3x weekly" className="rounded-2xl border border-slate-800 bg-black p-3"><option>3x weekly</option><option>Daily</option><option>Weekends</option><option>Whenever I can</option></select></label></section>
    <div className="flex flex-wrap gap-3"><button name="intent" value="complete" className="rounded-full bg-tw-blue px-6 py-3 font-black text-white">Start my feed</button><button name="intent" value="skip" className="rounded-full border border-slate-700 px-6 py-3 font-black text-slate-300">Skip for now</button></div>
  </form></main>;
}
