"use client";

import { Brain, Search, SendHorizonal } from "lucide-react";
import { useState } from "react";
import {
  actionIcons,
  composerTools,
  learner,
  navItems,
  posts,
  trendingConfusions,
  tutors,
  tutorsToFollow,
  type PollOption,
  type Post,
  type TutorId
} from "@/data/twutor";

export function TwutorApp() {
  const [toast, setToast] = useState<string | null>(null);

  function cue(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 1800);
  }

  return (
    <div className="mx-auto grid min-h-screen max-w-[1420px] grid-cols-1 bg-black text-[#e7e9ea] lg:grid-cols-[286px_minmax(520px,640px)_380px]">
      <LeftNav onCue={cue} />
      <main className="min-h-screen border-x border-tw-border lg:border-l-0">
        <TopBar />
        <Composer onCue={cue} />
        <button
          className="w-full border-b border-tw-border py-3 text-center text-tw-blue transition hover:bg-tw-blue/10"
          onClick={() => cue("Loaded 3 fresh tutor arguments")}
        >
          Show 3 new tutor posts
        </button>
        <section aria-label="Tutor feed">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </section>
      </main>
      <RightRail />
      <FloatingActions />
      {toast ? <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#e7e9ea] px-4 py-2 text-sm font-extrabold text-black shadow-2xl">{toast}</div> : null}
    </div>
  );
}

function LeftNav({ onCue }: { onCue: (message: string) => void }) {
  return (
    <aside className="sticky top-0 hidden h-screen flex-col gap-3 border-r border-tw-border px-6 py-5 lg:flex">
      <div className="mb-4 text-[34px] font-black tracking-[-0.08em]">twut<span className="text-tw-blue">or</span></div>
      <nav className="space-y-1" aria-label="Primary">
        {navItems.map((item) => (
          <button
            key={item.label}
            className={`flex w-max items-center gap-5 rounded-full px-3.5 py-3 text-[21px] transition hover:bg-white/10 ${item.active ? "font-black" : "font-bold"}`}
          >
            <span className="relative">
              <item.icon className="h-7 w-7" strokeWidth={2.3} />
              {item.badge ? <span className="absolute -right-2 -top-2 rounded-full bg-tw-blue px-1.5 text-xs font-black text-white">{item.badge}</span> : null}
            </span>
            {item.label}
          </button>
        ))}
      </nav>
      <button className="mt-2 h-[54px] w-[220px] rounded-full bg-tw-blue text-lg font-black text-white transition hover:bg-sky-400" onClick={() => onCue("Tutor council is listening")}>Ask Tutors</button>
      <div className="mt-auto flex items-center gap-3 rounded-full p-2 transition hover:bg-white/10">
        <img src={learner.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
        <div className="min-w-0">
          <div className="font-extrabold leading-tight">{learner.name}</div>
          <div className="text-tw-muted">{learner.handle}</div>
        </div>
        <span className="ml-auto text-tw-muted">•••</span>
      </div>
    </aside>
  );
}

function TopBar() {
  return (
    <header className="sticky top-0 z-20 border-b border-tw-border bg-black/80 backdrop-blur-xl">
      <h1 className="px-4 pb-2 pt-3 text-xl font-black">Home</h1>
      <div className="grid grid-cols-3 text-center font-extrabold text-tw-muted">
        {[
          ["For You", true],
          ["Following", false],
          ["Build Mode", false]
        ].map(([label, active]) => (
          <div key={String(label)} className={`relative py-4 ${active ? "text-[#e7e9ea]" : ""}`}>
            {label}
            {active ? <span className="absolute bottom-0 left-[32%] right-[32%] h-1 rounded-full bg-tw-blue" /> : null}
          </div>
        ))}
      </div>
    </header>
  );
}

function Composer({ onCue }: { onCue: (message: string) => void }) {
  return (
    <section className="grid grid-cols-[48px_1fr] gap-4 border-b border-tw-border px-4 py-5">
      <img src={learner.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
      <div>
        <div className="mb-5 text-2xl font-medium text-tw-muted">What are you trying to understand?</div>
        <div className="flex items-center justify-between border-t border-tw-border/70 pt-3">
          <div className="flex gap-4 text-tw-blue">
            {composerTools.map((Icon, idx) => <Icon key={idx} className="h-5 w-5" strokeWidth={2.4} />)}
          </div>
          <button className="rounded-full bg-tw-blue px-6 py-2 font-black text-white" onClick={() => onCue("Your confusion became a tutor thread")}>Ask</button>
        </div>
      </div>
    </section>
  );
}

function PostCard({ post }: { post: Post }) {
  const tutor = tutors[post.tutorId];
  const Verified = actionIcons.verified;

  return (
    <article className="grid grid-cols-[48px_1fr] gap-4 border-b border-tw-border px-4 py-4">
      <img src={tutor.avatar} alt={`${tutor.name} avatar`} className="h-12 w-12 rounded-full object-cover" />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-[15px]">
          <span className="font-black text-white">{tutor.name}</span>
          <Verified className="h-4 w-4 fill-tw-blue text-black" />
          <span className="truncate text-tw-muted">{tutor.handle} · {post.time}</span>
          <span className="ml-auto text-tw-muted">•••</span>
        </div>
        <p className="mt-1 whitespace-pre-line text-[16px] leading-snug text-white">{post.body}</p>
        {post.diagram ? <Diagram nodes={post.diagram.nodes} caption={post.diagram.caption} /> : null}
        {post.quote ? <QuoteCard quote={post.quote} /> : null}
        {post.poll ? <Poll options={post.poll} /> : null}
        {post.trace ? <Trace data={post.trace} /> : null}
        {post.challenge ? <Challenge {...post.challenge} /> : null}
        <Actions post={post} />
      </div>
    </article>
  );
}

function Diagram({ nodes, caption }: { nodes: string[]; caption: string }) {
  return (
    <div className="mt-3 rounded-2xl border border-sky-700/70 bg-sky-950/30 p-4">
      <div className="flex flex-wrap items-center gap-3 text-tw-blue">
        {nodes.map((node, index) => (
          <span key={node} className="contents">
            <span className="rounded-xl border border-sky-700 bg-slate-950 px-3 py-2 text-sm font-black text-white">{node}</span>
            {index < nodes.length - 1 ? <span className="font-black">→</span> : null}
          </span>
        ))}
      </div>
      <div className="mt-3 text-sm text-slate-300">{caption}</div>
    </div>
  );
}

function QuoteCard({ quote }: { quote: NonNullable<Post["quote"]> }) {
  const tutor = tutors[quote.tutorId];
  return (
    <div className="mt-3 rounded-2xl border border-tw-border p-3">
      <div className="font-black">{tutor.name} <span className="font-medium text-tw-muted">{tutor.handle} · {quote.time}</span></div>
      <p className="mt-1 leading-snug">{quote.body}</p>
    </div>
  );
}

function Poll({ options }: { options: PollOption[] }) {
  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-tw-border">
      {options.map((option) => (
        <div key={option.label} className="flex items-center justify-between border-b border-tw-border px-4 py-3 last:border-b-0">
          <span className="font-bold">{option.label}</span>
          <span className="font-black">{option.percent}%</span>
        </div>
      ))}
    </div>
  );
}

function Trace({ data }: { data: Record<string, string | boolean | number> }) {
  return (
    <div className="mt-3 rounded-2xl border border-slate-700 bg-slate-950 p-4 font-mono text-sm leading-relaxed">
      {Object.entries(data).map(([key, value]) => (
        <div key={key}><span className="text-tw-muted">{key}: </span><span className={typeof value === "boolean" ? "text-emerald-400" : key === "policy" ? "text-red-400" : "text-sky-400"}>{String(value)}</span></div>
      ))}
    </div>
  );
}

function Challenge({ title, body, cta }: NonNullable<Post["challenge"]>) {
  return (
    <div className="mt-3 rounded-2xl border border-amber-600/70 bg-amber-950/20 p-4">
      <div className="font-black text-amber-400">{title}</div>
      <p className="mt-3 leading-snug">{body}</p>
      <button className="mt-4 rounded-full bg-amber-400 px-4 py-2 text-sm font-black text-black">{cta}</button>
    </div>
  );
}

function Actions({ post }: { post: Post }) {
  const Reply = actionIcons.reply;
  const Repost = actionIcons.repost;
  const CheckIcon = actionIcons.check;
  const Views = actionIcons.views;
  const Bookmark = actionIcons.bookmark;
  const Build = actionIcons.build;
  const item = "flex items-center gap-1.5 text-sm text-tw-muted";

  return (
    <div className="mt-3 flex items-center justify-between pr-7">
      <span className={item}><Reply className="h-5 w-5" />{post.metrics.replies}</span>
      <span className={item}><Repost className="h-5 w-5" />{post.metrics.reposts}</span>
      <span className={`${item} text-emerald-500`}><CheckIcon className="h-5 w-5" />{post.metrics.checks}</span>
      <span className={item}><Views className="h-5 w-5" />{post.metrics.views}</span>
      <span className={item}><Bookmark className="h-5 w-5" /></span>
      <span className={item}><Build className="h-5 w-5" />Build</span>
    </div>
  );
}

function RightRail() {
  return (
    <aside className="sticky top-0 hidden h-screen overflow-y-auto px-6 py-4 lg:block no-scrollbar">
      <label className="mb-4 flex h-12 items-center gap-3 rounded-full border border-tw-border bg-black px-4 text-tw-muted">
        <Search className="h-5 w-5" />
        <input className="w-full bg-transparent outline-none" placeholder="Search Twutor" />
      </label>
      <RailCard title="Your learning arc">
        <div className="h-2 rounded-full bg-[#24282d]"><div className="h-2 w-[42%] rounded-full bg-gradient-to-r from-tw-blue to-emerald-500" /></div>
        <div className="mt-7 font-black">Platform × AI Engineering</div>
        <div className="mt-1 text-sm text-tw-muted">42% through “AI systems as platform problems.”</div>
      </RailCard>
      <RailCard title="Trending confusions" tight>
        {trendingConfusions.map(([count, title], index) => (
          <div key={title} className="border-t border-tw-border px-4 py-3">
            <div className="text-sm text-tw-muted">{index + 1} · {count}</div>
            <div className="font-black">{title}</div>
          </div>
        ))}
      </RailCard>
      <RailCard title="Tutors to follow" tight>
        {tutorsToFollow.map((id) => <FollowTutor key={id} id={id} />)}
      </RailCard>
    </aside>
  );
}

function RailCard({ title, children, tight = false }: { title: string; children: React.ReactNode; tight?: boolean }) {
  return (
    <section className={`mb-4 overflow-hidden rounded-3xl border border-tw-border ${tight ? "" : "p-4"}`}>
      <h2 className={`text-xl font-black ${tight ? "p-4" : "mb-4"}`}>{title}</h2>
      {children}
    </section>
  );
}

function FollowTutor({ id }: { id: TutorId }) {
  const tutor = tutors[id];
  return (
    <div className="flex items-center gap-3 border-t border-tw-border px-4 py-3">
      <img src={tutor.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
      <div className="min-w-0 flex-1">
        <div className="truncate font-black">{tutor.name}</div>
        <div className="truncate text-sm text-tw-muted">{tutor.handle}</div>
      </div>
      <button className="rounded-full bg-white px-4 py-1.5 text-sm font-black text-black">Follow</button>
    </div>
  );
}

function FloatingActions() {
  return (
    <div className="fixed bottom-7 right-7 hidden flex-col gap-3 xl:flex">
      <button className="grid h-14 w-14 place-items-center rounded-2xl border border-tw-border bg-[#111418] shadow-xl"><Brain className="h-6 w-6" /></button>
      <button className="grid h-14 w-14 place-items-center rounded-2xl border border-tw-border bg-[#111418] shadow-xl"><SendHorizonal className="h-6 w-6" /></button>
    </div>
  );
}
