export function canRunDevelopmentReset({ nodeEnv, enabled }: { nodeEnv?: string; enabled?: string }) {
  return nodeEnv === "development" && enabled === "true";
}
