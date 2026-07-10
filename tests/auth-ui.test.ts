import { describe, expect, it } from "vitest";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { getSafeRedirectPath } from "@/lib/auth/redirects";

describe("authentication errors", () => {
  it("returns actionable messages for expected credential failures", () => {
    expect(getAuthErrorMessage("INVALID_EMAIL_OR_PASSWORD")).toBe("That email and password combination did not work.");
    expect(getAuthErrorMessage("USER_ALREADY_EXISTS")).toBe("An account with that email already exists. Try signing in instead.");
  });

  it("does not leak unexpected provider details", () => {
    expect(getAuthErrorMessage("SQLSTATE 23505: auth_accounts_password_secret")).toBe(
      "We could not complete that request. Please try again."
    );
  });
});

describe("post-authentication redirects", () => {
  it.each(["https://evil.example", "//evil.example", "/\\\\evil.example", "/%5c%5cevil.example", "/%25255c%25255cevil.example", "/%0d%0aevil"])(
    "rejects non-local target %s",
    (target) => expect(getSafeRedirectPath(target, "https://twutor.example")).toBe("/")
  );

  it("preserves a local path and query", () => {
    expect(getSafeRedirectPath("/saved?tab=models", "https://twutor.example")).toBe("/saved?tab=models");
  });

  it.each(["/search?q=100%25", "/search?q=a%26admin%3Dtrue", "/search?q=section%23one", "/learn/%E2%9C%93"])(
    "preserves safe encoded URL semantics for %s",
    (target) => expect(getSafeRedirectPath(target, "https://twutor.example")).toBe(target)
  );
});
