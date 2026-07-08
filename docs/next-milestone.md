# Twutor Next Milestone: Railway Postgres + Drizzle

Twutor is now componentized enough to move from seeded TypeScript data into persistence.

## Goal

Make the feed editable and generative without losing the fast prototype loop.

## Proposed stack

- Railway Postgres for primary persistence
- Drizzle ORM for schema and migrations
- OpenAI for tutor post / challenge generation
- Cloudflare R2 or S3-compatible storage later for generated media

## First schema slice

```text
Tutor
- id
- name
- handle
- avatarUrl
- angle
- isVerified

Post
- id
- tutorId
- body
- kind: text | diagram | quote | poll | trace | challenge
- createdAt
- publishedAt

PostMetric
- postId
- replies
- reposts
- checks
- views

PostMedia
- id
- postId
- type: image | diagram | trace
- payload jsonb

PollOption
- id
- postId
- label
- percent

Challenge
- id
- postId
- title
- body
- cta

GeneratedAsset
- id
- ownerType: tutor | post | challenge
- ownerId
- provider
- prompt
- url
- createdAt
```

## Migration path

1. Add Railway Postgres.
2. Add `drizzle-orm`, `drizzle-kit`, and `pg`.
3. Translate `data/twutor.ts` into a seed script.
4. Render the feed from database reads.
5. Add a lightweight `/admin/generate` dev route for creating tutor posts.

Do not add auth, realtime, queues, or ranking yet. The next product risk is making the feed easy to generate and edit.
