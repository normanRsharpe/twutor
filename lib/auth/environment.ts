type AuthEnvironment = {
  DATABASE_URL?: string;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
};

function estimatedEntropyBits(value: string) {
  const counts = new Map<string, number>();
  for (const character of value) counts.set(character, (counts.get(character) ?? 0) + 1);
  return [...counts.values()].reduce((bits, count) => {
    const probability = count / value.length;
    return bits - count * Math.log2(probability);
  }, 0);
}

export function validateAuthEnvironment(environment: AuthEnvironment) {
  for (const key of ["DATABASE_URL", "BETTER_AUTH_SECRET", "BETTER_AUTH_URL"] as const) {
    if (!environment[key]) throw new Error(`${key} is required when Twutor authentication is enabled.`);
  }

  if (environment.BETTER_AUTH_SECRET!.length < 32 || estimatedEntropyBits(environment.BETTER_AUTH_SECRET!) < 120) {
    throw new Error("BETTER_AUTH_SECRET must contain at least 32 characters and 120 bits of estimated entropy.");
  }

  const baseUrl = new URL(environment.BETTER_AUTH_URL!);
  const isLocal = baseUrl.hostname === "localhost" || baseUrl.hostname === "127.0.0.1";
  if (baseUrl.protocol !== "https:" && !isLocal) {
    throw new Error("BETTER_AUTH_URL must use HTTPS outside localhost.");
  }

  return {
    databaseUrl: environment.DATABASE_URL!,
    secret: environment.BETTER_AUTH_SECRET!,
    baseUrl: baseUrl.origin
  };
}
