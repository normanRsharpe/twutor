"use client";

import { EyeOff, LogOut, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { askTutors, reactToPost, recordPostHidden, submitLearnerFeedback, togglePostSaved, toggleTutorFollow, voteOnPoll } from "@/app/actions";
import { signOut } from "@/app/auth-actions";
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
import type { FeedData, LearningArc, TutorView } from "@/lib/feed-queries";

export function TwutorApp({
  feedData,
  selectedTutorId,
  mode = "feed",
  learnerIdentity
}: {
  feedData: FeedData;
  selectedTutorId?: TutorId;
  mode?: "feed" | "tutors" | "saved";
  learnerIdentity?: { name: string; handle: string; avatarUrl: string };
}) {
  const [toast, setToast] = useState<string | null>(null);

  function cue(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 1800);
  }

  const selectedTutor = selectedTutorId ? feedData.tutors[selectedTutorId] : null;

  return (
    <div className="mx-auto grid min-h-screen max-w-[1420px] grid-cols-1 bg-black text-[#e7e9ea] lg:grid-cols-[286px_minmax(520px,640px)_380px]">
      <LeftNav onCue={cue} learnerIdentity={learnerIdentity} />
      <main className="min-h-screen border-x border-tw-border lg:border-l-0">
        {mode === "tutors" ? <DirectoryTopBar /> : selectedTutor ? <TutorHero tutor={selectedTutor} /> : <TopBar activeFeed={feedData.activeFeed} mode={mode} />}
        {mode === "tutors" ? (
          <TutorDirectory tutors={feedData.tutors} />
        ) : (
          <>
            <Composer onCue={cue} />
            <div className="w-full border-b border-tw-border py-3 text-center text-sm text-tw-muted">
              {selectedTutor ? `Showing ${selectedTutor.name}'s teaching feed` : feedData.activeFeed === "saved" ? "Showing posts you saved" : feedData.activeFeed === "following" ? "Showing posts from tutors you follow" : "Your current learning feed"}
            </div>
            <section aria-label="Tutor feed">
              {feedData.posts.length ? (
                feedData.posts.map((post) => <PostCard key={post.id} post={post} tutors={feedData.tutors} />)
              ) : (
                <div className="border-b border-tw-border px-6 py-12 text-center text-tw-muted">{feedData.activeFeed === "saved" ? "Saved posts will collect here when you tap bookmark." : "Follow a tutor to start shaping this feed."}</div>
              )}
            </section>
          </>
        )}
      </main>
      <RightRail tutors={feedData.tutors} tutorsToFollow={feedData.tutorsToFollow} learningArc={feedData.learningArc} socialActivity={feedData.socialActivity} />
      {toast ? <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#e7e9ea] px-4 py-2 text-sm font-extrabold text-black shadow-2xl">{toast}</div> : null}
    </div>
  );
}

function LeftNav({ onCue, learnerIdentity }: { onCue: (message: string) => void; learnerIdentity?: { name: string; handle: string; avatarUrl: string } }) {
  const activeLearner = learnerIdentity ?? { name: learner.name, handle: learner.handle, avatarUrl: learner.avatar };

  return (
    <aside className="sticky top-0 hidden h-screen flex-col gap-3 border-r border-tw-border px-6 py-5 lg:flex">
      <a href="/" className="mb-4 text-[34px] font-black tracking-[-0.08em]">twut<span className="text-tw-blue">or</span></a>
      <nav className="space-y-1" aria-label="Primary">
        {navItems.filter((item) => !["Build Lab", "Explore", "More"].includes(item.label)).map((item) => {
          const href = item.label === "Home" ? "/" : item.label === "Tutor Replies" ? "/replies" : item.label === "Tutors" ? "/tutors" : item.label === "Saved Models" ? "/saved" : item.label === "Progress" ? "/memory" : "#";
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
      <a href="/replies" className="mt-2 grid h-[54px] w-[220px] place-items-center rounded-full bg-tw-blue text-lg font-black text-white transition hover:bg-sky-400">Ask Tutors</a>
      <div className="mt-auto flex items-center gap-3 rounded-full p-2 transition hover:bg-white/10">
        <img src={activeLearner.avatarUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
        <div className="min-w-0">
          <div className="truncate font-extrabold leading-tight">{activeLearner.name}</div>
          <div className="truncate text-tw-muted">{activeLearner.handle}</div>
        </div>
        <form action={signOut} className="ml-auto">
          <button aria-label="Sign out" title="Sign out" className="rounded-full p-2 text-tw-muted transition hover:bg-white/10 hover:text-white">
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </div>
    </aside>
  );
}

function TopBar({ activeFeed, mode }: { activeFeed: "for-you" | "following" | "saved"; mode: "feed" | "tutors" | "saved" }) {
  const tabs = [
    { label: "For You", href: "/", active: activeFeed === "for-you" && mode !== "saved" },
    { label: "Following", href: "/?feed=following", active: activeFeed === "following" },
    { label: "Saved", href: "/saved", active: activeFeed === "saved" || mode === "saved" }
  ];

  return (
    <header className="sticky top-0 z-20 border-b border-tw-border bg-black/80 backdrop-blur-xl">
      <h1 className="px-4 pb-2 pt-3 text-xl font-black">{activeFeed === "saved" ? "Saved Models" : "Home"}</h1>
      <div className="grid grid-cols-3 text-center font-extrabold text-tw-muted">
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
      <form action={askTutors}>
        <label className="grid gap-3 text-2xl font-medium text-tw-muted">
          Ask the tutor council
          <textarea
            name="question"
            rows={3}
            className="resize-none rounded-3xl border border-transparent bg-transparent px-4 py-3 text-xl font-medium text-white outline-none placeholder:text-tw-muted focus:border-tw-border focus:bg-white/[0.03]"
            placeholder="What are you trying to understand?"
          />
        </label>
        <div className="mt-4 flex items-center justify-between border-t border-tw-border/70 pt-3">
          <div className="flex gap-4 text-tw-blue">
            {composerTools.map((Icon, idx) => <Icon key={idx} className="h-5 w-5" strokeWidth={2.4} />)}
          </div>
          <button className="rounded-full bg-tw-blue px-6 py-2 font-black text-white">Ask tutors</button>
        </div>
      </form>
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
        {post.poll ? <Poll postId={post.id} options={post.poll} /> : null}
        {post.trace ? <Trace data={post.trace} /> : null}
        {post.challenge ? <Challenge {...post.challenge} /> : null}
        <Actions post={post} />
        <FeedbackControls postId={post.id} />
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

function Poll({ postId, options }: { postId: string; options: PollOption[] }) {
  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-tw-border">
      {options.map((option, index) => (
        <form key={option.label} action={voteOnPoll} className="border-b border-tw-border last:border-b-0">
          <input type="hidden" name="postId" value={postId} />
          <input type="hidden" name="optionPosition" value={index} />
          <button className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-white/[0.04]" aria-label={`Vote ${option.label}`}>
            <span className="font-bold">{option.label}</span>
            <span className="font-black">{option.percent}%</span>
          </button>
        </form>
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
      <div className="mt-4 flex items-center gap-3 text-sm">
        <span className="rounded-full border border-amber-600/70 px-4 py-2 font-black text-amber-300">Build Lab planned</span>
        <span className="text-amber-100/70">{cta}</span>
      </div>
    </div>
  );
}

function Actions({ post }: { post: Post }) {
  const Repost = actionIcons.repost;
  const CheckIcon = actionIcons.check;
  const Views = actionIcons.views;
  const Bookmark = actionIcons.bookmark;
  const item = "flex items-center gap-1.5 text-sm text-tw-muted";

  return (
    <div className="mt-3 flex items-center justify-between pr-7">
      <span className={item} aria-label={`${post.metrics.replies} replies`}>{post.metrics.replies} replies</span>
      <form action={reactToPost}>
        <input type="hidden" name="postId" value={post.id} />
        <input type="hidden" name="reactionType" value="repost" />
        <button className={item} aria-label="Repost post"><Repost className="h-5 w-5" />{post.metrics.reposts}</button>
      </form>
      <form action={reactToPost}>
        <input type="hidden" name="postId" value={post.id} />
        <input type="hidden" name="reactionType" value="check" />
        <button className={`${item} text-emerald-500`} aria-label="Check post"><CheckIcon className="h-5 w-5" />{post.metrics.checks}</button>
      </form>

      <span className={item} aria-label={`${post.metrics.views} views`}>
        <Views className="h-5 w-5" />{post.metrics.views}
      </span>
      <form action={recordPostHidden}>
        <input type="hidden" name="postId" value={post.id} />
        <button className={item} aria-label="Hide post">
          <EyeOff className="h-5 w-5" />
        </button>
      </form>
      <form action={togglePostSaved}>
        <input type="hidden" name="postId" value={post.id} />
        <input type="hidden" name="saved" value={String(!post.isSaved)} />
        <button className={`${item} ${post.isSaved ? "text-tw-blue" : ""}`} aria-label={post.isSaved ? "Unsave post" : "Save post"}>
          <Bookmark className={`h-5 w-5 ${post.isSaved ? "fill-tw-blue" : ""}`} />
        </button>
      </form>
    </div>
  );
}

const feedbackChoices = [
  ["more_like_this", "More like this"],
  ["less_like_this", "Less like this"],
  ["too_advanced", "Too advanced"],
  ["need_an_example", "Need an example"]
] as const;

function FeedbackControls({ postId }: { postId: string }) {
  return (
    <details className="mt-3 text-sm text-tw-muted">
      <summary className="w-fit cursor-pointer font-bold hover:text-white">Tune this lesson</summary>
      <div className="mt-2 flex flex-wrap gap-2">
        {feedbackChoices.map(([signal, label]) => (
          <form key={signal} action={submitLearnerFeedback}>
            <input type="hidden" name="postId" value={postId} />
            <input type="hidden" name="signal" value={signal} />
            <button className="rounded-full border border-tw-border px-3 py-1.5 font-bold transition hover:border-tw-blue hover:text-white">
              {label}
            </button>
          </form>
        ))}
      </div>
    </details>
  );
}

function RightRail({
  tutors,
  tutorsToFollow,
  learningArc,
  socialActivity
}: {
  tutors: Record<TutorId, TutorView>;
  tutorsToFollow: TutorId[];
  learningArc: LearningArc;
  socialActivity: FeedData["socialActivity"];
}) {
  const visibleTrends = socialActivity.trendingConfusions.length ? socialActivity.trendingConfusions : trendingConfusions;
  const latestNotifications = socialActivity.notifications.slice(-6).reverse();

  return (
    <aside className="sticky top-0 hidden h-screen overflow-y-auto px-6 py-4 lg:block no-scrollbar">
      <div className="mb-4 rounded-2xl border border-tw-border px-4 py-3 text-sm font-bold text-tw-muted">
        Search and exploration are coming next
      </div>
      <RailCard title="Your learning arc">
        <div className="h-2 rounded-full bg-[#24282d]"><div className="h-2 rounded-full bg-gradient-to-r from-tw-blue to-emerald-500" style={{ width: `${learningArc.progressPercent}%` }} /></div>
        <div className="mt-7 font-black">{learningArc.title}</div>
        <div className="mt-1 text-sm text-tw-muted">{learningArc.progressPercent}% through “{learningArc.currentArc}.”</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {learningArc.focusTopics.map((topic) => <span key={topic} className="rounded-full border border-tw-border px-2.5 py-1 text-xs font-bold text-slate-300">{topic}</span>)}
        </div>
        <div className="mt-3 rounded-2xl bg-white/[0.04] p-3 text-xs leading-snug text-tw-muted">
          <span className="font-black text-slate-200">{learningArc.savedPostCount} saved</span> · {learningArc.lastSignal}
        </div>
      </RailCard>
      <RailCard title="Trending confusions" tight>
        {visibleTrends.map(([count, title], index) => (
          <div key={title} className="border-t border-tw-border px-4 py-3">
            <div className="text-sm text-tw-muted">{index + 1} · {count}</div>
            <div className="font-black">{title}</div>
          </div>
        ))}
      </RailCard>
      {latestNotifications.length ? (
        <RailCard title="Notifications" tight>
          {latestNotifications.map((notification) => (
            <div key={notification.id} className="border-t border-tw-border px-4 py-3 text-sm font-bold text-slate-200">
              {notification.label}
            </div>
          ))}
        </RailCard>
      ) : null}
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
