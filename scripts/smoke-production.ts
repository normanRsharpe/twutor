import { validateSmokeResults, type SmokeResult } from "../lib/deployment-smoke";

async function main() {
  const baseUrl = process.env.TWUTOR_BASE_URL?.replace(/\/$/, "");
  if (!baseUrl) throw new Error("TWUTOR_BASE_URL is required (for example, https://twutor-production.up.railway.app)");

  const paths = ["/api/health", "/sign-in", "/sign-in/not-a-real-route"];
  const results: SmokeResult[] = [];

  for (const path of paths) {
    const response = await fetch(`${baseUrl}${path}`, { redirect: "manual", signal: AbortSignal.timeout(15_000) });
    const isJson = response.headers.get("content-type")?.includes("application/json") ?? false;
    results.push({
      path,
      status: response.status,
      redirected: response.redirected || (response.status >= 300 && response.status < 400),
      ...(path === "/api/health" && isJson ? { body: await response.json() } : {})
    });
  }

  validateSmokeResults(results);
  console.log(JSON.stringify({ ok: true, baseUrl, checks: results.map(({ path, status }) => ({ path, status })) }));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Production smoke check failed");
  process.exitCode = 1;
});
