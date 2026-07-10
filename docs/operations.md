# Production operations

Twutor’s production baseline is designed to fail closed, expose only safe health data, and leave structured evidence when critical learner actions fail.

## Health and Railway readiness

`GET /api/health` runs `SELECT 1` against Postgres and never returns connection details.

- `200 { "ok": true, "database": "ok" }`
- `503` with `database: "missing"` or `database: "unavailable"`

`railway.json` uses this endpoint as the deployment health check. Railway should not mark a new deployment healthy until the application and database both respond.

## Post-deployment smoke check

Run after Railway reports the new deployment as online:

```bash
PATH=/opt/homebrew/bin:$PATH \
TWUTOR_BASE_URL=https://twutor-production.up.railway.app \
npm run smoke:production
```

The check requires:

- healthy `/api/health` response and database dependency
- `/sign-in` returns 200
- a public unknown route under `/sign-in` returns 404 without an authentication redirect

A non-zero exit blocks release completion.

## Structured operational events

Critical authentication, Ask Tutor, onboarding, and private-memory writes emit one-line JSON to stderr when they fail, then rethrow so the learner sees the recoverable error screen. Events contain only an allowlisted action, fixed error code, and timestamp. Learner identifiers, submitted values, and raw error messages are not logged.

Search Railway logs for:

```text
"event":"critical_action_failed"
```

Create a Railway log alert for that marker and a service alert for repeated `/api/health` failures. The client-side recoverable error screen also emits `route_render_failed` to the browser console with only Next.js’s opaque digest. Treat database or authentication failures as urgent; isolated validation failures can be investigated during normal support.

## Backup and restore rehearsal

Railway volume backups remain the primary managed backup. The repository also includes a portable logical-backup rehearsal that proves a snapshot can be restored into a **disposable** Postgres database.

Requirements: `pg_dump`, `pg_restore`, and `psql` at the same major version as production Postgres. Confirm that version with `show server_version` before installing the client. The disposable restore target should use that major version too. The target is cleaned during restore; never point it at production.

```bash
SOURCE_DATABASE_URL='postgres://source' \
RESTORE_DATABASE_URL='postgres://disposable_restore_target' \
TWUTOR_ALLOW_DESTRUCTIVE_RESTORE=true \
TWUTOR_APPROVED_RESTORE_TARGET='system_identifier:database_name' \
PATH=/path/to/matching-postgresql/bin:$PATH \
npm run verify:backup
```

Obtain the approval value from the disposable target with `select system_identifier::text || ':' || current_database() from pg_control_system()`. The script independently reads the canonical server/database identities from both connections, rejects the source database even when aliases or credentials make the URLs look different, and requires an exact match with the approved target identity before `pg_dump` or `pg_restore` runs. It then deletes the temporary dump on exit, restores without ownership/privileges, verifies core tables, and checks the Drizzle migration ledger. Do not print, save, or commit database URLs or dump files.

## Release checklist

1. Apply migrations using the Railway Postgres public URL from the Postgres service.
2. Run unit tests, typecheck, and production build.
3. Merge and wait for the new Railway deployment ID to become plain `Online`.
4. Run `npm run smoke:production` against the live domain.
5. Confirm no new `critical_action_failed` events and that `/api/health` stays healthy.
6. Record the deployment and verification evidence in Linear.
