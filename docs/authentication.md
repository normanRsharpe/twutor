# Authentication and learner sessions

Twutor uses Better Auth with the Drizzle/Postgres adapter. Authentication identities and sessions live in dedicated `auth_*` tables; product data continues to reference Twutor's `learners.id` domain key.

## Identity boundary

- Better Auth owns credentials, password hashes, sessions, and cookies.
- `learners.auth_user_id` maps one auth user to one stable Twutor learner.
- Learner handles are derived from the collision-safe learner UUID, never from email.
- Email is currently unverified profile/login data. It must not be used as an authorization or ownership signal. Verification and recovery email delivery are future account-control work.
- The first authenticated learner-aware mutation is Ask Tutors. Comprehensive scoping of every learner-owned read and mutation is tracked separately in TWU-44.
- Production authentication is rollout-locked until that isolation work is complete. Keep `TWUTOR_MULTI_USER_ENABLED=false`; protected routes, direct actions, and auth API requests fail closed.
- Admin access uses immutable Better Auth user IDs from `TWUTOR_ADMIN_USER_IDS`, not normal learner authentication or email addresses.

## Required environment

```text
DATABASE_URL
BETTER_AUTH_SECRET
BETTER_AUTH_URL
TWUTOR_MULTI_USER_ENABLED
TWUTOR_ADMIN_USER_IDS
```

`BETTER_AUTH_URL` is the exact origin, such as `https://twutor-production.up.railway.app`, without `/api/auth`. HTTPS is required outside localhost. Keep `BETTER_AUTH_SECRET` stable and private.

Production fails closed when auth configuration is missing. `BETTER_AUTH_SECRET` must have at least 32 characters and an estimated 120 bits of entropy. Keep `TWUTOR_MULTI_USER_ENABLED` false in production until TWU-44 is accepted. `TWUTOR_ADMIN_USER_IDS` is a comma-separated allowlist of immutable Better Auth user IDs.

## Explicit local demo mode

The seeded Norman learner is available only when both conditions hold:

```text
NODE_ENV=development
TWUTOR_DEMO_MODE=true
```

Example:

```bash
TWUTOR_DEMO_MODE=true npm run dev
```

Production ignores the demo flag. The normal Playwright suite explicitly enables local demo mode; production-like auth acceptance does not.

## Migrations

Migration `drizzle/0009_lyrical_kronos.sql` creates the auth tables and learner mapping. Apply with:

```bash
npm run db:migrate
```

## Verification

```bash
npm run test
npm run typecheck
npm run build
npm run e2e
npm run e2e:auth
```

The production-like auth journey lives in `e2e-auth/auth.spec.ts` and uses `playwright.auth.config.ts`. It requires real Postgres and Better Auth environment values. It verifies sign-up, refresh, sign-out, protected-route denial, sign-in, and an independent second browser session resolving the same learner.
