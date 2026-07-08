# Twutor Persistence Slice

Twutor now has the first real data layer: Railway Postgres + Drizzle + an idempotent seed from the original tutor/feed data.

## What this slice covers

- Railway Postgres attached to the live Railway project
- `DATABASE_URL` wired into the Twutor app service through a Railway service reference
- Drizzle schema and migration
- idempotent seed script from `data/twutor.ts`
- DB-backed home feed
- DB-backed tutor profile pages
- follow/unfollow for the demo learner
- tutor-specific feed filtering at `/tutors/[id]`
- generated avatar metadata for each tutor

## Tables

```text
learners
  id, name, handle, avatar_url, created_at

tutors
  id, name, handle, avatar_url, bio, angle, specialty_tags[], is_verified, created_at

tutor_follows
  learner_id, tutor_id, created_at

generated_assets
  id, owner_type, owner_id, provider, model, prompt, url, metadata, created_at

posts
  id, tutor_id, kind, body, time_label, sort_order, created_at, published_at

post_metrics
  post_id, replies, reposts, checks, views

diagram_nodes
  post_id, position, label, caption

quote_posts
  post_id, tutor_id, time_label, body

poll_options
  post_id, position, label, percent

trace_cards
  post_id, payload jsonb

challenges
  id, post_id, title, body, cta
```

## Post types

The seed creates one post of each first-class type:

```text
text
 diagram
 quote
 poll
 trace
 challenge
```

Attachments are normalized by type instead of being stored as one giant JSON blob. That keeps the feed flexible while still making each post shape queryable.

## Commands

Generate migrations after schema edits:

```bash
PATH=/opt/homebrew/bin:$PATH npm run db:generate
```

Run migrations against Railway Postgres from this machine using the Postgres public connection variable, without printing secrets:

```bash
PATH=/opt/homebrew/bin:$PATH railway run --service Postgres --environment production -- \
  sh -lc 'PATH=/opt/homebrew/bin:$PATH; export DATABASE_URL="$DATABASE_PUBLIC_URL"; npm run db:migrate'
```

Seed demo content:

```bash
PATH=/opt/homebrew/bin:$PATH railway run --service Postgres --environment production -- \
  sh -lc 'PATH=/opt/homebrew/bin:$PATH; export DATABASE_URL="$DATABASE_PUBLIC_URL"; npm run db:seed'
```

Production runtime uses the app service `DATABASE_URL` reference, which points at Railway's internal Postgres URL. Do not print or commit the actual value.

## Current demo learner

The first slice uses a fixed demo learner:

```text
norman
```

This lets follow/unfollow and tutor personalization work before auth is added.

## Next persistence upgrades

- add real auth-backed learner IDs
- add replies/questions
- add saved posts
- add challenge completion state
- add admin/editor CRUD for tutors/posts
- add generated post review workflow
