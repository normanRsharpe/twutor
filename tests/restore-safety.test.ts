import { describe, expect, it } from "vitest";
import { assertRestoreTargetIsSafe, formatDatabaseIdentity } from "@/lib/restore-safety";

const source = { systemIdentifier: "server-1", database: "twutor" };
const target = { systemIdentifier: "server-2", database: "twutor_restore_rehearsal" };

describe("restore target safety", () => {
  it("requires exact approval of the canonical target identity", () => {
    expect(() => assertRestoreTargetIsSafe(source, target, formatDatabaseIdentity(target))).not.toThrow();
    expect(() => assertRestoreTargetIsSafe(source, target, "server-2:other_database")).toThrow("approved restore target does not match");
  });

  it("rejects the source database even when its URL text differs", () => {
    expect(() => assertRestoreTargetIsSafe(source, { ...source }, formatDatabaseIdentity(source))).toThrow("source and restore target are the same database");
  });
});