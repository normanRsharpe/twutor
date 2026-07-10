const authErrorMessages: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "That email and password combination did not work.",
  USER_ALREADY_EXISTS: "An account with that email already exists. Try signing in instead.",
  PASSWORD_TOO_SHORT: "Use a password with at least 8 characters.",
  INVALID_EMAIL: "Enter a valid email address."
};

export function getAuthErrorMessage(code: string | undefined) {
  if (!code) return "We could not complete that request. Please try again.";
  return authErrorMessages[code] ?? "We could not complete that request. Please try again.";
}
