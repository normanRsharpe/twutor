import { describe, expect, it } from "vitest";
import { assessReadiness } from "@/lib/readiness";

describe("production readiness", () => {
  it("reports unhealthy when the database dependency is unavailable", async () => {
    await expect(assessReadiness({ hasDatabaseUrl: false, pingDatabase: async () => true })).resolves.toEqual({ ok: false, status: 503, database: "missing" });
  });

  it("reports healthy only after a database ping succeeds", async () => {
    await expect(assessReadiness({ hasDatabaseUrl: true, pingDatabase: async () => true })).resolves.toEqual({ ok: true, status: 200, database: "ok" });
  });

  it("reports unavailable when the database ping fails", async () => {
    await expect(assessReadiness({ hasDatabaseUrl: true, pingDatabase: async () => false })).resolves.toEqual({ ok: false, status: 503, database: "unavailable" });
    await expect(assessReadiness({ hasDatabaseUrl: true, pingDatabase: async () => { throw new Error("connection failed"); } })).resolves.toEqual({
      ok: false,
      status: 503,
      database: "unavailable"
    });
  });
});
