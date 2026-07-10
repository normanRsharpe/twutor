import "server-only";
import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db/client";
import { adminAuditEvents } from "@/lib/db/schema";

export async function recordAdminAuditEvent({ actorAuthUserId, action, targetType, targetId, outcome, metadata = {} }: {
  actorAuthUserId: string | null;
  action: string;
  targetType: string;
  targetId: string;
  outcome: "success" | "rejected" | "failed";
  metadata?: Record<string, unknown>;
}) {
  if (!actorAuthUserId) return;
  await getDb().insert(adminAuditEvents).values({ id: randomUUID(), actorAuthUserId, action, targetType, targetId, outcome, metadata });
}
