import postgres from "postgres";
import { assertRestoreTargetIsSafe, formatDatabaseIdentity, type DatabaseIdentity } from "../lib/restore-safety";

async function readIdentity(url: string): Promise<DatabaseIdentity> {
  const sql = postgres(url, { max: 1, prepare: false });
  try {
    const [row] = await sql<{ system_identifier: string; database: string }[]>`
      select system_identifier::text, current_database() as database
      from pg_control_system()
    `;
    if (!row) throw new Error("database identity query returned no rows");
    return { systemIdentifier: row.system_identifier, database: row.database };
  } finally {
    await sql.end();
  }
}

async function main() {
  const sourceUrl = process.env.SOURCE_DATABASE_URL;
  const restoreUrl = process.env.RESTORE_DATABASE_URL;
  if (!sourceUrl || !restoreUrl) throw new Error("SOURCE_DATABASE_URL and RESTORE_DATABASE_URL are required");

  const [source, target] = await Promise.all([readIdentity(sourceUrl), readIdentity(restoreUrl)]);
  assertRestoreTargetIsSafe(source, target, process.env.TWUTOR_APPROVED_RESTORE_TARGET);
  console.log(formatDatabaseIdentity(target));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "restore target verification failed");
  process.exitCode = 1;
});
