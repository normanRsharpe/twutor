export type SmokeResult = {
  path: string;
  status: number;
  body?: unknown;
  redirected?: boolean;
};

export function validateSmokeResults(results: SmokeResult[]) {
  const requiredPaths = ["/api/health", "/sign-in", "/sign-in/not-a-real-route"];
  const byPath = new Map(results.map((result) => [result.path, result]));
  for (const path of requiredPaths) {
    if (!byPath.has(path)) throw new Error(`missing smoke check: ${path}`);
  }

  const health = byPath.get("/api/health")!;

  const body = health.body as { ok?: boolean; database?: string } | undefined;
  if (health.status !== 200 || body?.ok !== true || body.database !== "ok") {
    throw new Error(`health check failed (${health.status})`);
  }

  const signIn = byPath.get("/sign-in")!;
  if (signIn.redirected) throw new Error("/sign-in redirected unexpectedly");
  if (signIn.status !== 200) throw new Error(`/sign-in returned ${signIn.status}; expected 200`);

  const missing = byPath.get("/sign-in/not-a-real-route")!;
  if (missing.status !== 404) throw new Error(`/sign-in/not-a-real-route returned ${missing.status}; expected 404`);
}
