# Twutor

A Twitter/X-inspired social learning feed for curated tutoring around platform engineering and AI engineering.

## Current app

Twutor is now a Next.js app. The main route renders the componentized feed:

```text
/
```

The previous static prototype is preserved for compatibility:

```text
/sketches/006-openai-avatar-feed/index.html
```

## Running locally

Use a modern Node runtime. On this machine the Homebrew Node binary is preferred:

```bash
PATH=/opt/homebrew/bin:$PATH npm install
PATH=/opt/homebrew/bin:$PATH npm run dev
```

Production-style local run:

```bash
PATH=/opt/homebrew/bin:$PATH npm run build
PATH=/opt/homebrew/bin:$PATH PORT=3000 npm start
```

## Verification

```bash
PATH=/opt/homebrew/bin:$PATH npm run typecheck
PATH=/opt/homebrew/bin:$PATH npm run build
PATH=/opt/homebrew/bin:$PATH npm audit --omit=dev
```

## Railway deployment

This repo is ready for Railway using Nixpacks:

- build command: `npm run build`
- start command: `npm start`
- runtime port: Railway provides `PORT`
- Node engine: `>=20 <27`

Deploy from GitHub by creating a Railway project from `normanRsharpe/twutor`, or use the Railway CLI from this repo.

## App structure

```text
app/                 Next.js app router
components/          React UI components for the feed shell
components/twutor-app.tsx
data/twutor.ts       Typed seed data for tutors, posts, polls, traces, challenges
public/assets/       Runtime-served avatar/icon assets
public/sketches/     Legacy static prototypes
```

Earlier explorations:

- `public/sketches/001-feed-as-classroom/` — warm editorial feed
- `public/sketches/002-tutor-council/` — tutor personas debating ideas
- `public/sketches/003-signal-stream/` — clean learning dashboard/feed hybrid
- `public/sketches/004-tutor-feed-dark/` — dark X-like social learning feed
- `public/sketches/005-tutor-feed-icons-avatars/` — Lucide icons + local SVG avatars
- `public/sketches/006-openai-avatar-feed/` — Lucide icons + OpenAI-generated tutor avatars

## Assets

- `public/assets/vendor/lucide.min.js` — vendored Lucide icon library for legacy prototypes
- `public/assets/avatars/` — interim SVG avatar assets
- `public/assets/avatars/openai/` — OpenAI-generated tutor profile images

## Product direction

Twutor should feel like a living expert feed, not a static course dashboard:

- recurring tutor personas
- sharp social-feed posts
- quote-tweet-style disagreements
- polls/quizzes
- diagrams and code/trace cards
- build challenges
- trending confusions
- personalized learning arcs

## Product roadmap

See [`docs/product-roadmap.md`](docs/product-roadmap.md) for the real-app feature roadmap.

## Persistence

See [`docs/persistence.md`](docs/persistence.md) for the Railway Postgres + Drizzle schema, migrations, seed, DB-backed feed, tutor profiles, and follow model.

## Agentic posting

See [`docs/agentic-posting.md`](docs/agentic-posting.md) for the learner-signal → brief → intent → pacing → admin review → publish/feedback workflow.

## Next milestone

See [`docs/next-milestone.md`](docs/next-milestone.md) for the original Railway Postgres + Drizzle plan.
