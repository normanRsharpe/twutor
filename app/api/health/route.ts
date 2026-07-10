import { sql } from "drizzle-orm";
import { getDatabaseUrl, getDb } from "@/lib/db/client";
import { assessReadiness } from "@/lib/readiness";

export const dynamic = "force-dynamic";

export async function GET() {
  const readiness = await assessReadiness({
    hasDatabaseUrl: Boolean(getDatabaseUrl()),
    pingDatabase: async () => {
      await getDb().execute(sql`select 1`);
      return true;
    }
  });
  return Response.json({ ok: readiness.ok, database: readiness.database }, { status: readiness.status, headers: { "Cache-Control": "no-store" } });
}
