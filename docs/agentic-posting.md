# Agentic Posting Pipeline

Twutor's agentic posting system is a **human-reviewed feed operations loop**. It can plan why a tutor post should exist, pace that post against learner state, and collect native feedback after exposure. It must not directly publish generated content into the learner feed.

```text
learner signals
  → content brief
  → research notes
  → agentic post intent
  → feed pacing plan
  → admin review
  → explicit publish or retire
  → feed exposure + native feedback
  → next pacing pass
```

## Operating rules

1. **No direct autopublish.** Agentic systems may create briefs, notes, intents, or draft candidates, but a post becomes feed-visible only after an explicit reviewed publish/link step.
2. **Pacing stays learner-safe.** The simulator targets no more than **20% unseen inventory** in a feed plan so curiosity does not swamp familiarity.
3. **Intent means feed move, not curriculum lockstep.** The system can choose confidence boosts, revisits, leaps, parallel tracks, and serendipity; not every post needs to be the next prerequisite.
4. **Feedback is native.** Save, open, hide, dismiss, revisit, and shown events are preferred over heavy survey/rating UI.
5. **Admin review is the control point.** Humans review hypothesis, tutor voice, learner effect, and risk before publishing or retiring an intent.

## Pipeline objects

### 1. Learner concept state

Learner memory records where the demo learner appears confident, stale, unknown, or ready for a next action.

Used for:

- choosing whether a post should introduce, revisit, deepen, or boost confidence
- avoiding a feed made only of brand-new material
- giving pacing logic a reason to prefer familiar or stale concepts

Current implementation:

- Drizzle table: `learner_concept_states`
- Seed rows: `buildSeedRows()` in `lib/seed-data.ts`

### 2. Content briefs

A content brief is the editorial strategy for a small run of agentic tutor posts. It keeps generated/feed work grounded in a learner goal instead of turning every idea into a candidate backlog.

A brief captures:

- learner id
- theme and objective
- audience context
- desired post mix
- status

Current implementation:

- Drizzle table: `content_briefs`
- Seed example: `brief-agentic-feed-foundation`

### 3. Research notes

Research notes compress source/context into reviewable claims before any post intent is shaped.

A note captures:

- brief id
- source label / source url when available
- summary
- claims
- confidence
- reviewer notes

Current implementation:

- Drizzle table: `research_notes`
- Notes attach to briefs, not directly to individual intents yet.

### 4. Agentic post intents

An agentic post intent is the durable record of **why a tutor post should exist**.

It is not the final post body and it is not an autopublish instruction.

An intent captures:

- learner id
- tutor id
- optional content brief id
- lifecycle status: `planned`, `published`, `retired`
- target and related concept slugs
- feed move: `bridge`, `introduce`, `revisit`, `deepen`, `apply`, `confidence_boost`, `leap`, `parallel_track`, `serendipity`
- novelty level: `familiar`, `adjacent`, `stretch`, `leap`
- landing hypothesis
- expected learner effect
- expected seen/save probabilities
- suggested post kind
- voice notes
- risk notes
- optional `publishedPostId`

Publish guard requirements:

- feed move is present
- landing hypothesis is present
- expected learner effect is present
- expected seen/save probabilities are integers from 0 to 100
- published post id is supplied at publish time

Current implementation:

- Drizzle table: `agentic_post_intents`
- Validation helpers: `lib/agentic-post-intents.ts`

### 5. Generated candidates

Generated candidates are the future draft layer between an intent and a real post. They are intentionally not first-class in this milestone yet.

Until candidate storage exists, treat the generated output as transient review material. The durable object remains the intent; the learner-facing object remains a normal `posts` row.

Rules for future candidate work:

- candidates may be generated from an intent, brief, and research notes
- candidates must preserve tutor voice and risk notes
- candidates must not publish themselves
- accepted candidates should become normal posts, then link back through `agentic_post_intents.published_post_id`
- rejected candidates should not pollute the learner feed or pacing inventory

## Feed pacing

The pacing simulator decides which existing posts and planned intents are safe/useful to consider for a feed pass.

It uses:

- existing posts
- planned/published intents
- learner concept state
- followed tutors
- desired post mix from the brief
- seen inventory derived from feed events

The key guardrail is the **20% unseen-post pacing target**. For a feed of `N`, at most `floor(N * 0.2)` selected items should be unseen. Seen/familiar material is not filler; it creates confidence, rhythm, and context for occasional stretch material.

Supported feed moves include non-linear learning:

- `confidence_boost` for feel-good recognition
- `revisit` for stale concepts
- `leap` for horizon expansion
- `parallel_track` for adjacent production intuition
- `serendipity` for social-feed surprise

Current implementation:

- Pure simulator: `lib/feed-pacing.ts`
- Core helpers: `buildFeedPacingInventory()`, `planFeedPacing()`, `getUnseenRatio()`

## Admin review

The first admin surface is the human-in-the-loop review queue.

Route:

```text
/admin/intents
```

It shows:

- planned/published/retired counts
- tutor identity
- linked brief theme
- feed move and novelty
- target concepts
- landing hypothesis
- expected learner effect
- voice notes
- risk notes
- expected seen/save probabilities
- native signal counts for linked published posts
- publish guard errors

Actions:

- **Publish link**: marks a valid planned intent as published and stores the linked `publishedPostId`.
- **Retire**: removes a planned or published intent from active consideration without deleting history.

Exposure guard:

- enabled in development by default
- in production, requires `TWUTOR_ENABLE_ADMIN_INTENTS=true`

Current implementation:

- Page: `app/admin/intents/page.tsx`
- Server actions: `app/admin/intents/actions.ts`
- View model: `lib/admin-intents.ts`
- DB helpers: `lib/admin-intent-queries.ts`

## Feed exposure and native feedback

After posts are shown in the feed, Twutor records append-only native events.

Event types:

- `shown`
- `opened`
- `saved`
- `unsaved`
- `hidden`
- `dismissed`
- `revisited`

Seen inventory is derived from positive exposure/depth events: `shown`, `opened`, `saved`, and `revisited`.

This lets future pacing compare expected behavior from the intent against actual learner behavior without asking for explicit ratings.

Current implementation:

- Drizzle table: `feed_events`
- Helpers: `lib/feed-events.ts`
- Runtime event IDs use UUID-backed IDs to avoid collisions.

## End-to-end workflow

### Planning

1. Inspect learner concept state and recent feed events.
2. Create or update a content brief for the desired learning moment.
3. Attach research notes with compressed claims and review context.
4. Create agentic post intents for the brief.
5. Use feed moves and novelty levels to mix familiar, adjacent, stretch, and occasional leap material.

### Pacing

1. Build feed pacing inventory from existing posts and intents.
2. Mark seen posts/intents from feed event history.
3. Score items against learner state, followed tutors, and desired post mix.
4. Select a plan that stays under the 20% unseen cap.

### Review

1. Open `/admin/intents`.
2. Review hypothesis, expected effect, tutor voice, and risk notes.
3. If the intent is not useful/safe, retire it.
4. If a reviewed post exists, link its `postId` and publish the intent.

### Publish

Publishing an intent does not invent a feed post. It only links a reviewed intent to an existing `posts` row and changes lifecycle state to `published`.

### Learn from feedback

1. Record `shown/opened/saved/hidden/dismissed/revisited` events as learners use the feed.
2. Derive seen inventory from events.
3. Feed the next pacing pass with actual exposure and engagement history.
4. Later, compare expected seen/save probabilities against observed signals.

## What this milestone intentionally does not do

- no direct autopublishing
- no autonomous bulk generation
- no prompt playground
- no rich CMS editor
- no auth/role system beyond the production env guard
- no first-class generated candidate table yet
- no automatic ranking replacement for the main feed
- no heavy explicit feedback surveys

## Verification checklist

For this milestone, the docs should remain aligned with these implementation checks:

```bash
PATH=/opt/homebrew/bin:$PATH npm run test
PATH=/opt/homebrew/bin:$PATH npm run typecheck
PATH=/opt/homebrew/bin:$PATH npm run build
```

The relevant test coverage lives in:

- `tests/learner-concept-state.test.ts`
- `tests/content-briefs.test.ts`
- `tests/agentic-post-intents.test.ts`
- `tests/feed-pacing.test.ts`
- `tests/feed-events.test.ts`
- `tests/admin-intents.test.ts`
