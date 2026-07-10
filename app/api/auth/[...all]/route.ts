import { getAuth } from "@/lib/auth/auth";
import { multiUserRolloutEnabled } from "@/lib/auth/server";
import { runObservedAction } from "@/lib/operational-events";

function handleAuthRequest(request: Request) {
  return runObservedAction({ action: "auth_request" }, () => getAuth().handler(request));
}

export async function GET(request: Request) {
  if (!multiUserRolloutEnabled()) return new Response("Authentication rollout is not enabled.", { status: 503 });
  return handleAuthRequest(request);
}

export async function POST(request: Request) {
  if (!multiUserRolloutEnabled()) return new Response("Authentication rollout is not enabled.", { status: 503 });
  return handleAuthRequest(request);
}
