export async function assessReadiness({ hasDatabaseUrl, pingDatabase }: { hasDatabaseUrl: boolean; pingDatabase: () => Promise<boolean> }) {
  if (!hasDatabaseUrl) return { ok: false, status: 503, database: "missing" as const };
  try {
    return (await pingDatabase())
      ? { ok: true, status: 200, database: "ok" as const }
      : { ok: false, status: 503, database: "unavailable" as const };
  } catch {
    return { ok: false, status: 503, database: "unavailable" as const };
  }
}
