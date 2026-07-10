#!/usr/bin/env bash
set -euo pipefail

: "${SOURCE_DATABASE_URL:?SOURCE_DATABASE_URL is required}"
: "${RESTORE_DATABASE_URL:?RESTORE_DATABASE_URL is required}"
: "${TWUTOR_ALLOW_DESTRUCTIVE_RESTORE:?Set TWUTOR_ALLOW_DESTRUCTIVE_RESTORE=true for a disposable restore database}"
: "${TWUTOR_APPROVED_RESTORE_TARGET:?Set TWUTOR_APPROVED_RESTORE_TARGET to the canonical system_identifier:database target}"

if [[ "$TWUTOR_ALLOW_DESTRUCTIVE_RESTORE" != "true" ]]; then
  echo "Refusing restore: TWUTOR_ALLOW_DESTRUCTIVE_RESTORE must be true" >&2
  exit 1
fi

for command in pg_dump pg_restore psql; do
  command -v "$command" >/dev/null || { echo "$command is required" >&2; exit 1; }
done

tsx scripts/verify-restore-target.ts >/dev/null

workdir="$(mktemp -d "${TMPDIR:-/tmp}/twutor-restore.XXXXXX")"
trap 'rm -rf "$workdir"' EXIT
backup="$workdir/twutor.dump"

pg_dump --format=custom --no-owner --no-privileges --dbname="$SOURCE_DATABASE_URL" --file="$backup"
pg_restore --clean --if-exists --no-owner --no-privileges --dbname="$RESTORE_DATABASE_URL" "$backup"

required_tables="auth_users learners learner_onboardings posts tutors ask_tutor_questions admin_audit_events"
for table in $required_tables; do
  present="$(psql "$RESTORE_DATABASE_URL" -Atqc "select to_regclass('public.$table') is not null")"
  if [[ "$present" != "t" ]]; then
    echo "Restore verification failed: missing table $table" >&2
    exit 1
  fi
done

migration_count="$(psql "$RESTORE_DATABASE_URL" -Atqc 'select count(*) from drizzle.__drizzle_migrations')"
echo "Backup restore rehearsal passed: required tables present; migration ledger rows=$migration_count"
