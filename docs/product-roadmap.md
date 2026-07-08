# Twutor Product Roadmap

Twutor should become a social learning app where expert tutor personas make platform engineering and AI engineering feel like a living feed.

The core loop:

```text
learner confusion → tutor feed posts → debate / diagrams / challenges → saved understanding → progress arc
```

## North-star experience

Open Twutor and it should feel like a sharp technical corner of Twitter where every account is trying to make you better at building AI/platform systems.

The app needs to do five things well:

1. Give each tutor a recognizable point of view.
2. Turn hard engineering topics into addictive feed-native posts.
3. Let learners ask questions and get tutor-style responses.
4. Convert passive reading into small build challenges.
5. Remember what the learner is trying to understand.

## Milestone 1 — Real feed foundation

Goal: stop hardcoding the app without changing the product feel.

Features:

- Railway Postgres database
- Drizzle schema and migrations
- seed script for current tutor personas and posts
- feed rendered from database records
- post types: text, diagram, quote, poll, trace, challenge
- basic admin/dev seed reset
- production-safe environment variable setup

Why this matters: the feed becomes editable and durable.

## Milestone 2 — Tutor personas become first-class

Goal: make the accounts feel like recurring creators, not sample data.

Features:

- tutor profile pages
- tutor follow/unfollow
- tutor bio, teaching angle, specialty tags
- generated avatar metadata and prompt history
- verified tutor badge/state
- tutor-specific feed filtering
- "Tutors to follow" powered by data

Why this matters: Twutor's hook is the cast.

## Milestone 3 — Learner account and memory

Goal: make Twutor remember the learner.

Features:

- auth with Clerk or Auth.js
- learner profile
- saved posts
- saved tutors
- onboarding: choose interests and current skill level
- learning arc/progress record
- continue-reading / resume module
- private learner notes on posts

Why this matters: the feed starts feeling personal instead of broadcast-only.

## Milestone 4 — Ask Tutors

Goal: make the composer real.

Features:

- ask-a-question composer
- route question to one or more tutor personas
- AI-generated tutor answer draft
- citation/context requirement for factual answers
- answer appears as a tutor thread
- learner can ask follow-up questions
- moderation/safety guardrails for generated content

Why this matters: Twutor becomes interactive tutoring, not just content.

## Milestone 5 — Build Lab

Goal: turn posts into action.

Features:

- challenge detail pages
- challenge start/complete flow
- challenge instructions and acceptance criteria
- starter snippets or repo links
- learner submission notes
- completion badges/checkmarks
- related posts after completion

Why this matters: platform/AI engineering is learned by building, not scrolling forever.

## Milestone 6 — Generated content pipeline

Goal: make the feed renewable without hand-authoring every post.

Features:

- admin `/admin/generate` flow
- generate tutor posts from topic prompts
- generate diagrams/trace cards/polls/challenges
- editorial review before publish
- generated asset storage via R2/S3-compatible bucket
- prompt/version metadata
- retry/failure tracking

Why this matters: the feed needs creator velocity.

## Milestone 7 — Social texture

Goal: make the app feel alive.

Features:

- comments/replies
- quote-tutor posts
- repost/check/bookmark interactions
- poll voting
- notification rail for tutor replies
- trending confusions powered by activity
- "show new posts" backed by timestamps

Why this matters: the prototype already looks social; now the mechanics need to exist.

## Milestone 8 — Learning intelligence

Goal: make Twutor smarter than a generic feed.

Features:

- topic graph for platform engineering and AI engineering
- learner confusion taxonomy
- post-to-topic tagging
- recommendations based on saved/read/asked/completed behavior
- spaced resurfacing of concepts
- personal learning arc generation
- search across posts, tutors, and challenges

Why this matters: this is where Twutor becomes a learning product, not a content app.

## Milestone 9 — Production hardening

Goal: keep it fast, safe, and operable.

Features:

- structured logging
- analytics events
- error reporting
- rate limits for AI generation and ask flows
- admin role checks
- data backup/export path
- CI checks for typecheck/build
- smoke test against Railway deployment

Why this matters: AI product demos rot quickly without operational rails.

## Recommended next build order

Do not build all of this at once.

The next four slices should be:

1. Railway Postgres + Drizzle feed persistence.
2. Tutor profile pages.
3. Saved posts + learner memory-lite.
4. Ask Tutors composer with AI-generated draft responses.

That sequence keeps the product moving from static → durable → personal → interactive.
