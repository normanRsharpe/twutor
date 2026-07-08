"use client";

import { Brain, Search, SendHorizonal, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { toggleTutorFollow } from "@/app/actions";
import {
  actionIcons,
  composerTools,
  learner,
  navItems,
  trendingConfusions,
  type PollOption,
  type Post,
  type TutorId
} from "@/data/twutor";
import type { FeedData, TutorView } from "@/lib/feed-queries";

export function TwutorApp({ feedData, selectedTutorId, mode = "feed" }: { feedData: FeedData; selectedTutorId?: TutorId; mode?: "feed" | "tutors" }) {
  const [toast, setToast] = useState<string | null>(null);

  function cue(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 1800);
  }

  const selectedTutor = selectedTutorId ? feedData.tutors[selectedTutorId] : null;

  return (
    <div className="mx-auto grid min-h-screen max-w-[1420px] grid-cols-1 bg-black text-[#e7e9ea] lg:grid-cols-[286px_minmax(520px,640px)_380px]">
      <LeftNav onCue={cue} />
      <main className="min-h-screen border-x border-tw-border lg:border-l-0">
        {mode === "tutors" ? <DirectoryTopBar /> : selectedTutor ? <TutorHero tutor={selectedTutor} /> : <TopBar activeFeed={feedData.activeFeed} />}
        {mode === "tutors" ? (
          <TutorDirectory tutors={feedData.tutors} />
        ) : (
          <>
            <Composer onCue={cue} />
            <button
              className="w-full border-b border-tw-border py-3 text-center text-tw-blue transition hover:bg-tw-blue/10"
              onClick={() => cue(selectedTutor ? `Filtered to ${selectedTutor.name}` : feedData.activeFeed === "following" ? "Following feed refreshed" : "Loaded 3 fresh tutor arguments")}
            >
              {selectedTutor ? `Showing ${selectedTutor.name}'s teaching feed` : feedData.activeFeed === "following" ? "Showing posts from tutors you follow" : "Show 3 new tutor posts"}
            </button>
            <section aria-label="Tutor feed">
              {feedData.posts.length ? (
                feedData.posts.map((post) => <PostCard key={post.id} post={post} tutors={feedData.tutors} />)
              ) : (
                <div className="border-b border-tw-border px-6 py-12 text-center text-tw-muted">Follow a tutor to start shaping this feed.</div>
              )}
            </section>
          </>
        )}
      </main>
      <RightRail tutors={feedData.tutors} tutorsToFollow={feedData.tutorsToFollow} />
      <FloatingActions />
      {toast ? <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#e7e9ea] px-4 py-2 text-sm font-extrabold text-black shadow-2xl">{toast}</div> : null}
    </div>
  );
}

function LeftNav({ onCue }: { onCue: (message: string) => void }) {
  return (
    <aside className="sticky top-0 hidden h-screen flex-col gap-3 border-r border-tw-border px-6 py-5 lg:flex">
      <a href="/" className="mb-4 text-[34px] font-black tracking-[-0.08em]">twut<span className="text-tw-blue">or</span></a>
      <nav className="space-y-1" aria-label="Primary">
        {navItems.filter((item) => item.label !== "Build Lab" && item.label !== "Progress").map((item) => {
          const href = item.label === "Home" ? "/" : item.label === "Tutors" ? "/tutors" : "#";
          return (
            <a
              key={item.label}
              href={href}
              onClick={(event) => {
                if (href === "#") {
                  event.preventDefault();
                  onCue(`${item.label} is queued for a later Twutor slice`);
                }
              }}
              className={`flex w-max items-center gap-5 rounded-full px-3.5 py-3 text-[21px] transition hover:bg-white/10 ${item.active ? "font-black" : "font-bold"}`}
            >
              <span className="relative">
                <item.icon className="h-7 w-7" strokeWidth={2.3} />
                {item.badge ? <span className="absolute -right-2 -top-2 rounded-full bg-tw-blue px-1.5 text-xs font-black text-white">{item.badge}</span> : null}
              </span>
              {item.label}
            </a>
          );
        })}
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

function TopBar({ activeFeed }: { activeFeed: "for-you" | "following" }) {
  const tabs = [
    { label: "For You", href: "/", active: activeFeed === "for-you" },
    { label: "Following", href: "/?feed=following", active: activeFeed === "following" }
  ];

  return (
    <header className="sticky top-0 z-20 border-b border-tw-border bg-black/80 backdrop-blur-xl">
      <h1 className="px-4 pb-2 pt-3 text-xl font-black">Home</h1>
      <div className="grid grid-cols-2 text-center font-extrabold text-tw-muted">
        {tabs.map((tab) => (
          <a key={tab.label} href={tab.href} className={`relative py-4 ${tab.active ? "text-[#e7e9ea]" : ""}`}>
            {tab.label}
            {tab.active ? <span className="absolute bottom-0 left-[32%] right-[32%] h-1 rounded-full bg-tw-blue" /> : null}
          </a>
        ))}
      </div>
    </header>
  );
}

function DirectoryTopBar() {
  return (
    <header className="sticky top-0 z-20 border-b border-tw-border bg-black/80 px-4 py-4 backdrop-blur-xl">
      <div className="text-sm font-bold text-tw-muted">Tutor directory</div>
      <h1 className="mt-1 text-2xl font-black tracking-tight">Follow the voices you want in your feed</h1>
      <p className="mt-2 text-sm leading-snug text-tw-muted">Each tutor is a recurring lens on platform and AI engineering — not a generic lesson bucket.</p>
    </header>
  );
}

function TutorDirectory({ tutors }: { tutors: Record<TutorId, TutorView> }) {
  return (
    <section aria-label="Tutor directory" className="divide-y divide-tw-border">
      {(Object.values(tutors) as TutorView[]).map((tutor) => (
        <article key={tutor.id} className="px-4 py-5 transition hover:bg-white/[0.03]">
          <div className="flex gap-4">
            <a href={`/tutors/${tutor.id}`}>
              <img src={tutor.avatar} alt={`${tutor.name} avatar`} className="h-16 w-16 rounded-full object-cover" />
            </a>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <a href={`/tutors/${tutor.id}`} className="text-lg font-black text-white hover:underline">{tutor.name}</a>
                  <div className="text-sm text-tw-muted">{tutor.handle}</div>
                </div>
                <FollowForm tutor={tutor} compact />
              </div>
              <p className="mt-2 text-[17px] font-extrabold leading-snug text-white">{tutor.profileHeadline}</p>
              <p className="mt-1 leading-snug text-tw-muted">{tutor.bestFor}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {tutor.specialtyTags.map((tag) => <span key={tag} className="rounded-full border border-tw-border px-3 py-1 text-xs font-black text-slate-300">{tag}</span>)}
              </div>
              <div className="mt-3 rounded-2xl border border-tw-border bg-white/[0.03] p-3">
                <div className="mb-1 flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-tw-muted"><Sparkles className="h-4 w-4" /> Latest signal</div>
                <p className="text-sm leading-snug text-slate-200">{tutor.latestPostPreview}</p>
              </div>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}

function TutorHero({ tutor }: { tutor: TutorView }) {
  return (
    <header className="border-b border-tw-border bg-black">
      <div className="px-4 pb-3 pt-3">
        <a href="/" className="text-sm font-bold text-tw-blue">← Home</a>
        <h1 className="mt-1 text-xl font-black">{tutor.name}</h1>
        <div className="text-sm text-tw-muted">{tutor.handle}</div>
      </div>
      <div className="h-28 bg-gradient-to-r from-sky-950 via-slate-900 to-emerald-950" />
      <div className="px-4 pb-5">
        <div className="flex items-end justify-between">
          <img src={tutor.avatar} alt={`${tutor.name} avatar`} className="-mt-14 h-28 w-28 rounded-full border-4 border-black object-cover" />
          <FollowForm tutor={tutor} />
        </div>
        <h2 className="mt-3 text-2xl font-black">{tutor.name}</h2>
        <div className="text-tw-muted">{tutor.handle}</div>
        <p className="mt-3 text-xl font-black leading-tight text-white">{tutor.profileHeadline}</p>
        <p className="mt-2 leading-snug text-slate-200">{tutor.bio}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <ProfileFact label="Best for" value={tutor.bestFor} />
          <ProfileFact label="Teaching style" value={tutor.teachingStyle} />
        </div>
        <div className="mt-4 rounded-2xl border border-tw-border bg-white/[0.03] p-4">
          <div className="text-xs font-black uppercase tracking-[0.14em] text-tw-muted">Voice principles</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {tutor.voicePrinciples.map((principle) => <span key={principle} className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-200">{principle}</span>)}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {tutor.specialtyTags.map((tag) => <span key={tag} className="rounded-full border border-tw-border px-3 py-1 text-sm font-bold text-tw-muted">{tag}</span>)}
        </div>
        {tutor.generatedAvatar ? (
          <div className="mt-3 text-xs text-tw-muted">Avatar: {tutor.generatedAvatar.provider} / {tutor.generatedAvatar.model ?? "unknown model"}</div>
        ) : null}
      </div>
    </header>
  );
}

function ProfileFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-tw-border bg-white/[0.03] p-4">
      <div className="text-xs font-black uppercase tracking-[0.14em] text-tw-muted">{label}</div>
      <div className="mt-2 text-sm font-bold leading-snug text-slate-200">{value}</div>
    </div>
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

function PostCard({ post, tutors }: { post: Post; tutors: Record<TutorId, TutorView> }) {
  const tutor = tutors[post.tutorId];
  const Verified = actionIcons.verified;

  return (
    <article className="grid grid-cols-[48px_1fr] gap-4 border-b border-tw-border px-4 py-4">
      <a href={`/tutors/${tutor.id}`}><img src={tutor.avatar} alt={`${tutor.name} avatar`} className="h-12 w-12 rounded-full object-cover" /></a>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-[15px]">
          <a href={`/tutors/${tutor.id}`} className="font-black text-white hover:underline">{tutor.name}</a>
          <Verified className="h-4 w-4 fill-tw-blue text-black" />
          <span className="truncate text-tw-muted">{tutor.handle} · {post.time}</span>
          <span className="ml-auto text-tw-muted">•••</span>
        </div>
        <p className="mt-1 whitespace-pre-line text-[16px] leading-snug text-white">{post.body}</p>
        {post.diagram ? <Diagram nodes={post.diagram.nodes} caption={post.diagram.caption} /> : null}
        {post.quote ? <QuoteCard quote={post.quote} tutors={tutors} /> : null}
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

function QuoteCard({ quote, tutors }: { quote: NonNullable<Post["quote"]>; tutors: Record<TutorId, TutorView> }) {
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
  const item = "flex items-center gap-1.5 text-sm text-tw-muted";

  return (
    <div className="mt-3 flex items-center justify-between pr-7">
      <span className={item}><Reply className="h-5 w-5" />{post.metrics.replies}</span>
      <span className={item}><Repost className="h-5 w-5" />{post.metrics.reposts}</span>
      <span className={`${item} text-emerald-500`}><CheckIcon className="h-5 w-5" />{post.metrics.checks}</span>
      <span className={item}><Views className="h-5 w-5" />{post.metrics.views}</span>
      <span className={item}><Bookmark className="h-5 w-5" /></span>
    </div>
  );
}

function RightRail({ tutors, tutorsToFollow }: { tutors: Record<TutorId, TutorView>; tutorsToFollow: TutorId[] }) {
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
        {tutorsToFollow.map((id) => <FollowTutor key={id} tutor={tutors[id]} />)}
      </RailCard>
    </aside>
  );
}

function RailCard({ title, children, tight = false }: { title: string; children: ReactNode; tight?: boolean }) {
  return (
    <section className={`mb-4 overflow-hidden rounded-3xl border border-tw-border ${tight ? "" : "p-4"}`}>
      <h2 className={`text-xl font-black ${tight ? "p-4" : "mb-4"}`}>{title}</h2>
      {children}
    </section>
  );
}

function FollowTutor({ tutor }: { tutor: TutorView }) {
  return (
    <div className="flex items-center gap-3 border-t border-tw-border px-4 py-3">
      <a href={`/tutors/${tutor.id}`}><img src={tutor.avatar} alt="" className="h-10 w-10 rounded-full object-cover" /></a>
      <div className="min-w-0 flex-1">
        <a href={`/tutors/${tutor.id}`} className="block truncate font-black hover:underline">{tutor.name}</a>
        <div className="truncate text-sm text-tw-muted">{tutor.handle}</div>
      </div>
      <FollowForm tutor={tutor} compact />
    </div>
  );
}

function FollowForm({ tutor, compact = false }: { tutor: TutorView; compact?: boolean }) {
  return (
    <form action={toggleTutorFollow}>
      <input type="hidden" name="tutorId" value={tutor.id} />
      <input type="hidden" name="follow" value={String(!tutor.isFollowed)} />
      <button className={`${compact ? "px-4 py-1.5 text-sm" : "px-5 py-2"} rounded-full ${tutor.isFollowed ? "border border-tw-border bg-black text-white" : "bg-white text-black"} font-black`}>
        {tutor.isFollowed ? "Following" : "Follow"}
      </button>
    </form>
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
