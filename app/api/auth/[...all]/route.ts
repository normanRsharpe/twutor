import { getAuth } from "@/lib/auth/auth";
import { multiUserRolloutEnabled } from "@/lib/auth/server";

export async function GET(request: Request) {
  if (!multiUserRolloutEnabled()) return new Response("Authentication rollout is not enabled.", { status: 503 });
  return getAuth().handler(request);
}

export async function POST(request: Request) {
  if (!multiUserRolloutEnabled()) return new Response("Authentication rollout is not enabled.", { status: 503 });
  return getAuth().handler(request);
}
