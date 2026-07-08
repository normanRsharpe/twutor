# Agentic Feed Ops Foundation Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Build the first architecture for agentic posting: research-backed tutor content generation, learner-aware curation, and feed pacing that keeps Twutor engaging without flooding the learner.

**Architecture:** Add a thin content-ops layer on top of the existing Drizzle/Postgres feed. New tables model learner knowledge signals, source/research notes, posting hypotheses, recommendation decisions, and exposure/read state. Agents should not spray candidate drafts into a holding pen; they should decide which posts are likely to land for this learner, publish from a clear learning/engagement hypothesis, and then learn from whether the post was actually seen, saved, revisited, or ignored.

**Tech Stack:** Next.js 16 app router, React 19, Drizzle ORM, Railway Postgres, Vitest, existing tutor/persona/feed model.

---

## Product framing

Twutor should not become an infinite lesson dump. Agentic posting should feel like a sharp creator network that quietly adapts to the learner.

The new loop:

```text
learner signals → content strategy brief → agent research → landing hypothesis → publish planned tutor posts → feed pacing → exposure/read signals → next brief
```

Three non-negotiables:

1. **Learner model:** Track what the learner knows, half-knows, avoids, saves, revisits, and might benefit from seeing again.
2. **Research-to-post pipeline:** Agents do the heavy lifting: source scanning, idea distillation, content strategy, tutor voice adaptation, and social-feed optimization.
3. **Pacing budget:** Avoid the fake-growth trap of endless posts. Optimize for a feed where most posts are actually seen; target no more than 20% unseen.

---

## Current context

Existing foundation:

- `lib/db/schema.ts` defines learners, tutors, follows, saved posts, learning state, posts, metrics, attachments, generated assets.
- `lib/feed-queries.ts` assembles DB rows into the UI feed model.
- `lib/seed-data.ts` seeds tutor metadata, saved posts, follows, and learner learning state.
- `scripts/seed.ts` resets demo DB content.
- Tests exist under `tests/` for seed data, persona feed, learner memory, and learning arc.

Important constraint:

- Keep the near-term product feed-native. Do not drift into a traditional course/challenge app.
- Generated content can be rough at first, but the architecture should anticipate serious research, learner modeling, landing hypotheses, and recommendation. The system should create posts it believes should exist, not a pile of speculative candidates.

---

## Proposed data model

Add these concepts incrementally rather than all at once.

### Learner concept signals

A compact, inspectable model of learner familiarity:

```text
learner_concept_states
  learner_id
  concept_id
  label
  familiarity: unknown | seen | familiar | confident | stale
  confidence_score: 0-100
  interest_score: 0-100
  last_seen_at
  last_saved_at
  last_revisited_at
  evidence jsonb
```

Why: recommendation needs more than saved posts. It needs to know whether a topic is boring, confidence-building, overdue, or too advanced.

### Content briefs

The strategy object agents work from:

```text
content_briefs
  id
  learner_id
  theme
  objective
  target_concepts text[]
  revisit_concepts text[]
  avoid_concepts text[]
  desired_mix jsonb
  created_at
```

Why: generation should not be “make random posts.” It should start from a brief: today’s arc, learner need, tutor cast, and pacing.

### Research notes / source cards

```text
research_notes
  id
  brief_id
  source_url
  source_title
  summary
  claims jsonb
  citations jsonb
  created_at
```

Why: agents should gather and compress complexity before writing feed posts.

### Planned agentic posts

```text
agentic_post_plans
  id
  brief_id
  tutor_id
  kind
  body
  attachment_payload jsonb
  landing_hypothesis
  expected_learner_effect: introduce | deepen | revisit | confidence_boost | provoke_question
  voice_notes
  status: planned | published | retired
  expected_seen_probability
  expected_save_probability
  actual_post_id
  risk_notes
  created_at
  published_at
```

Why: agentic posting should be intentional. The unit is not “candidate draft”; it is “we believe this post will land because X.” The post can still carry internal provenance and risk notes, but the architecture should bias toward planned publication and learning from outcomes, not editorial backlog accumulation.

### Feed exposure events

```text
feed_exposure_events
  id
  learner_id
  post_id
  surface: for_you | following | saved | tutor_profile
  event_type: shown | opened | saved | dismissed | hidden | revisited
  occurred_at
```

Why: unseen-post budget needs exposure state. Saved/followed is not enough.

### Recommendation decisions

```text
feed_recommendation_decisions
  id
  learner_id
  post_id
  reason
  score
  rank
  decision_payload jsonb
  created_at
```

Why: non-deterministic curation should still be explainable. “Why did this post show up?” matters.

---

## Feed pacing principle

Define a small feed inventory budget before building a full recommender.

Initial rule of thumb:

```text
visible_daily_feed_target = 8-12 posts
max_unseen_ratio = 20%
revisit_ratio = 20-30%
new_concept_ratio = 40-60%
confidence_boost_ratio = 10-20%
```

This gives Twutor a rhythm:

- A few new ideas.
- A few revisits.
- A few confidence-building posts.
- A few spicy tutor takes.
- Not a bottomless pile of invisible generated content.

---

## Implementation tasks

### Task 1: Add agentic feed ops Beads epic and child issues

**Objective:** Track this as a first-class product slice rather than hiding it under the already-closed M1.

**Files:** none

**Commands:**

```bash
bd create --parent twutor-ixj --type epic --priority P0 --title "Milestone 1.5: Agentic feed ops foundation" --description "Create the architecture for learner-aware agentic posting and feed pacing so agents publish posts they believe will land for the learner, then learn from exposure and engagement." --acceptance "Agents can create research-backed tutor posts from explicit landing hypotheses; learner concept signals inform what should be posted; feed pacing tracks exposure and targets no more than 20% unseen posts."
```

Then create child issues for:

- learner concept signals
- planned agentic posts with landing hypotheses
- research-to-post content briefs
- post insertion/publish lifecycle
- feed exposure events
- recommendation/pacing simulator

**Verification:** `bd show <new-epic-id>` shows the new slice under `twutor-ixj`.

---

### Task 2: Add learner concept state schema

**Objective:** Give the recommendation layer a small, inspectable learner knowledge model.

**Files:**

- Modify: `lib/db/schema.ts`
- Modify: `lib/seed-data.ts`
- Modify: `scripts/seed.ts`
- Create/modify: `tests/learner-concepts.test.ts`

**Implementation notes:**

Add enum-like text or Drizzle `pgEnum` for familiarity states:

```ts
export const conceptFamiliarityEnum = pgEnum("concept_familiarity", ["unknown", "seen", "familiar", "confident", "stale"]);
```

Add `learnerConceptStates` with learner foreign key and evidence JSON.

Seed initial concepts:

- model gateways
- evals
- AI observability
- RAG/citations
- policy/sandboxing
- inference cost

**Test expectations:**

- seed rows include concept states for `demoLearnerId`
- concept states preserve familiarity and interest/confidence scores

**Verification:**

```bash
npm run test -- tests/learner-concepts.test.ts
npm run typecheck
```

---

### Task 3: Add planned agentic post schema

**Objective:** Represent posts agents believe should be published, including the hypothesis for why each post should land.

**Files:**

- Modify: `lib/db/schema.ts`
- Create: `lib/agentic-posts.ts`
- Create: `tests/agentic-posts.test.ts`

**Implementation notes:**

Add `agenticPostPlans` with:

- `briefId`
- `tutorId`
- `kind`
- `body`
- `attachmentPayload`
- `landingHypothesis`
- `expectedLearnerEffect`
- `voiceNotes`
- `status`
- `expectedSeenProbability`
- `expectedSaveProbability`
- `riskNotes`
- `actualPostId`

Add pure helper functions first:

- `validateAgenticPostPlan(plan)`
- `agenticPlanToPostInsert(plan, sortOrder)`

Do not call an LLM yet. Use static fixtures in tests. The important behavior is that a plan must include a landing hypothesis and expected learner effect before it can be published.

**Verification:**

```bash
npm run test -- tests/agentic-posts.test.ts
npm run typecheck
```

---

### Task 4: Add content brief and research note schema

**Objective:** Make generation strategy explicit before drafts are created.

**Files:**

- Modify: `lib/db/schema.ts`
- Create: `lib/content-briefs.ts`
- Create: `tests/content-briefs.test.ts`

**Implementation notes:**

Add `contentBriefs` and `researchNotes`.

Add a pure planner function:

```ts
buildContentBrief({ learnerArc, conceptStates, tutors, recentPosts })
```

Return a compact brief like:

```ts
{
  theme: "Model gateways are platform products",
  objective: "Move learner from familiar to confident on routing/policy/observability tradeoffs",
  targetConcepts: ["model gateways", "policy layer"],
  revisitConcepts: ["evals"],
  avoidConcepts: [],
  desiredMix: { hotTake: 2, diagram: 1, quote: 1, poll: 1 }
}
```

**Verification:**

```bash
npm run test -- tests/content-briefs.test.ts
npm run typecheck
```

---

### Task 5: Add recommendation and pacing simulator

**Objective:** Simulate a recommendation engine without needing mass users.

**Files:**

- Create: `lib/feed-pacing.ts`
- Create: `tests/feed-pacing.test.ts`

**Implementation notes:**

Start with pure functions:

- `scorePostForLearner(post, learnerConceptStates, exposureHistory)`
- `scorePlanLandingLikelihood(plan, learnerConceptStates, exposureHistory)`
- `buildFeedPlan({ posts, conceptStates, exposureEvents, targetCount })`
- `calculateUnseenRatio(posts, exposureEvents)`

Initial scoring signals:

- boost posts from followed tutors
- boost target concepts
- boost stale-but-known concepts for revisit
- lightly allow confident concepts for confidence boosts
- downrank posts dismissed/hidden recently
- cap same-tutor repetition
- cap same-concept repetition

**Test expectations:**

- simulator keeps unseen ratio at or below 20% for fixture data
- known/stale concepts appear but do not dominate
- new concepts appear in a controlled ratio

**Verification:**

```bash
npm run test -- tests/feed-pacing.test.ts
npm run typecheck
```

---

### Task 6: Add feed exposure event schema and server actions

**Objective:** Let the app record whether posts are actually seen or engaged with.

**Files:**

- Modify: `lib/db/schema.ts`
- Modify/create: relevant server action module, likely near existing save/follow actions
- Modify: feed UI component files under `components/`
- Create: tests if current interaction helpers are testable

**Implementation notes:**

Start with explicit interactions only:

- save
- unsave
- open tutor profile
- hide/show less like this later

Avoid fragile scroll-depth tracking until needed.

**Verification:**

```bash
npm run test
npm run typecheck
npm run build
```

---

### Task 7: Add first admin review surface

**Objective:** Inspect planned posts and their landing hypotheses without turning the workflow into a giant candidate backlog.

**Files:**

- Create: `app/admin/feed/page.tsx`
- Create: `app/admin/feed/actions.ts`
- Create: `components/admin/agentic-post-plans.tsx` if componentization helps

**Implementation notes:**

Keep it intentionally rough but safe:

- list planned/published/retired agentic post plans
- show tutor, kind, body, landing hypothesis, expected learner effect, voice notes, risk notes
- publish/retire controls
- publish a planned post into `posts` plus attachment rows
- guard with `NODE_ENV !== "production"` or an explicit `ADMIN_FEED_ENABLED=true`

**Verification:**

```bash
npm run typecheck
npm run build
```

Manual check:

- create fixture plan
- publish it
- see it render in feed

---

### Task 8: Add a non-LLM planned-post generator CLI

**Objective:** Exercise the architecture before integrating real LLM research agents by generating posts with explicit landing hypotheses.

**Files:**

- Create: `scripts/plan-agentic-posts.ts`
- Add script to `package.json`: `"content:plan": "tsx scripts/plan-agentic-posts.ts"`
- Create: `tests/agentic-post-planner.test.ts` only if pure helpers can be extracted

**Implementation notes:**

The script can use deterministic templates at first:

```text
Given a content brief, learner concept state, recent exposure history, and tutor voice metadata, create 3-5 planned posts with landing hypotheses.
```

The first CLI may insert plans with `status=planned`, but each plan should be publishable by design. The point is not “maybe someday”; the point is “we believe this should land because…”

**Verification:**

```bash
DATABASE_URL=... npm run content:plan
```

Expected output:

```text
Created 5 agentic post plans for brief <id>.
```

---

### Task 9: Document the content pipeline

**Objective:** Capture the product architecture so future agent work does not become random generation.

**Files:**

- Modify: `docs/product-roadmap.md`
- Modify: `docs/persistence.md`
- Create: `docs/agentic-posting.md`

**Documentation points:**

- Agentic posting creates planned posts from landing hypotheses, not speculative candidate piles.
- Content briefs guide research and tutor voice.
- Learner concept state informs curation.
- Feed pacing optimizes for seen posts, not infinite inventory.
- The first target is “credible simulation,” not mass-user collaborative filtering.

**Verification:**

```bash
git diff -- docs/product-roadmap.md docs/persistence.md docs/agentic-posting.md
```

---

## First implementation recommendation

Start with these three in order:

1. **Learner concept state** — gives the system taste about what the learner knows.
2. **Planned agentic posts** — gives every generated post a reason it should land.
3. **Feed pacing simulator** — makes “no more than 20% unseen” a real constraint.

Do not start with a beautiful admin UI. The architecture needs a brain before it needs a dashboard.

---

## Risks and tradeoffs

- **Too much schema too early:** keep fields compact and JSON escape hatches available for research/planning payloads.
- **Fake personalization:** make recommendations explainable; if the system cannot say why a post appeared, the model is too hand-wavy.
- **Infinite content sludge:** generated posts must be scarce, hypothesis-driven, and paced.
- **Overfitting to one learner:** acceptable for now. This is a single-user simulation, not collaborative filtering.
- **Agent research hallucination:** research notes should preserve source URLs/titles/claims so generated posts can later cite evidence.

---

## Open product questions

1. Should generated posts appear as normal tutor posts, or carry only internal provenance about the brief/research/hypothesis that produced them?
2. What is the first real content arc: model gateways, evals, AI observability, RAG quality, or agent security?
3. Should the learner explicitly tune the feed with “too easy / too advanced / more like this,” or should we infer from save/hide/revisit first?
4. Is “20% unseen” measured per day, per session, or rolling seven-day feed inventory?

Recommendation: measure it per rolling seven-day inventory first. Daily usage will be uneven, and a seven-day window better matches a curated learning feed.
