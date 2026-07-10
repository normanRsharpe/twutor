import { expect, test, type Page } from "@playwright/test";

async function finishOnboarding(page: Page) {
  await expect(page).toHaveURL("/onboarding", { timeout: 30_000 });
  await page.getByLabel("What are you here to build?").fill("Ship reliable AI systems");
  await page.getByLabel("LLM evals").check();
  await page.locator('input[name="tutors"][value="maya"]').check();
  await page.getByRole("button", { name: "Start my feed" }).click();
  await expect(page).toHaveURL("/", { timeout: 30_000 });
}

test("sign-up, sign-out, sign-in, and a second browser session resolve one learner", async ({ page, browser }) => {
  const email = `auth-e2e-${Date.now()}@example.com`;
  const password = "Twutor-test-password-43";
  const name = "Auth E2E Learner";

  await page.goto("/");
  await expect(page).toHaveURL(/\/sign-in\?next=/);

  await page.getByRole("link", { name: "Create an account" }).click();
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();

  await finishOnboarding(page);
  await expect(page.getByRole("heading", { name: "Home" })).toBeVisible();
  await expect(page.locator("aside").getByText(name)).toBeVisible();
  const handle = await page.locator("aside").locator("text=/^@auth-e2e-learner-/").textContent();
  expect(handle).toBeTruthy();

  await page.goto("/saved");
  await expect(page.locator("aside").getByText(handle!)).toBeVisible();
  await page.goto("/tutors");
  await expect(page.locator("aside").getByText(handle!)).toBeVisible();
  await page.goto("/");

  const question = `How should auth isolate tutor threads ${Date.now()}?`;
  await page.getByLabel("Ask the tutor council").fill(question);
  await page.getByRole("button", { name: "Ask tutors" }).click();
  await expect(page).toHaveURL(/\/replies\?thread=/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: question })).toBeVisible({ timeout: 30_000 });
  await page.reload();
  await expect(page.getByRole("heading", { name: question })).toBeVisible();
  await page.goto("/");
  await expect(page.locator("aside").getByText(handle!)).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
  await page.goto("/");
  await expect(page).toHaveURL(/\/sign-in\?next=/);

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/", { timeout: 30_000 });
  await expect(page.locator("aside").getByText(handle!)).toBeVisible();

  const secondContext = await browser.newContext();
  const secondPage = await secondContext.newPage();
  await secondPage.goto("/sign-in");
  await secondPage.getByLabel("Email").fill(email);
  await secondPage.getByLabel("Password").fill(password);
  await secondPage.getByRole("button", { name: "Sign in" }).click();
  await expect(secondPage).toHaveURL("/", { timeout: 30_000 });
  await expect(secondPage.locator("aside").getByText(handle!)).toBeVisible();
  await secondContext.close();
});

test("two authenticated learners cannot see each other's private learning state", async ({ page, browser }) => {
  const suffix = Date.now();
  const password = "Twutor-test-password-43";
  const question = `Account A private tutor question ${suffix}`;
  const note = `Account A private note ${suffix}`;

  await page.goto("/sign-up");
  await page.getByLabel("Name").fill("Account A");
  await page.getByLabel("Email").fill(`account-a-${suffix}@example.com`);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await finishOnboarding(page);

  await page.getByLabel("Ask the tutor council").fill(question);
  await page.getByRole("button", { name: "Ask tutors" }).click();
  await expect(page.getByRole("heading", { name: question })).toBeVisible({ timeout: 30_000 });

  await page.goto("/memory");
  await page.getByLabel("Private learning note").fill(note);
  await page.getByRole("button", { name: "Save note" }).click();
  await expect(page.getByText(note)).toBeVisible();

  await page.goto("/");
  await page.getByRole("button", { name: "Reply to post" }).first().click();
  await expect(page.getByText("Your reply joined a tutor thread")).toBeVisible();

  const secondContext = await browser.newContext();
  const secondPage = await secondContext.newPage();
  await secondPage.goto("/sign-up");
  await secondPage.getByLabel("Name").fill("Account B");
  await secondPage.getByLabel("Email").fill(`account-b-${suffix}@example.com`);
  await secondPage.getByLabel("Password").fill(password);
  await secondPage.getByRole("button", { name: "Create account" }).click();
  await finishOnboarding(secondPage);

  await secondPage.goto("/replies");
  await expect(secondPage.getByText(question)).toHaveCount(0);
  await secondPage.goto("/memory");
  await expect(secondPage.getByText(note)).toHaveCount(0);
  await secondPage.goto("/");
  await expect(secondPage.getByText("Your reply joined a tutor thread")).toHaveCount(0);

  await secondContext.close();
});

test("onboarding persists selected tutors and topics while skip creates a truthful empty arc", async ({ page, browser }) => {
  const suffix = Date.now();
  const password = "Twutor-test-password-45";

  await page.goto("/sign-up");
  await page.getByLabel("Name").fill("Preference Learner");
  await page.getByLabel("Email").fill(`preferences-${suffix}@example.com`);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL("/onboarding", { timeout: 30_000 });
  await page.getByLabel("What are you here to build?").fill("Make AI systems observable");
  await page.getByLabel("Observability").check();
  await page.getByLabel("RAG systems").check();
  await page.locator('input[name="tutors"][value="nora"]').check();
  await page.locator('input[name="tutors"][value="iris"]').check();
  await page.getByRole("button", { name: "Start my feed" }).click();
  await expect(page).toHaveURL("/", { timeout: 30_000 });
  await page.goto("/memory");
  await expect(page.getByText("0%")).toBeVisible();
  await expect(page.getByText("Observability")).toBeVisible();
  await expect(page.getByText("RAG systems")).toBeVisible();
  await expect(page.getByText("Nora")).toBeVisible();
  await expect(page.getByText("Iris")).toBeVisible();
  await page.goto("/onboarding");
  await expect(page).toHaveURL("/", { timeout: 30_000 });

  const skippedContext = await browser.newContext();
  const skippedPage = await skippedContext.newPage();
  await skippedPage.goto("/sign-up");
  await skippedPage.getByLabel("Name").fill("Skip Learner");
  await skippedPage.getByLabel("Email").fill(`skip-${suffix}@example.com`);
  await skippedPage.getByLabel("Password").fill(password);
  await skippedPage.getByRole("button", { name: "Create account" }).click();
  await expect(skippedPage).toHaveURL("/onboarding", { timeout: 30_000 });
  await skippedPage.getByRole("button", { name: "Skip for now" }).click();
  await expect(skippedPage).toHaveURL("/", { timeout: 30_000 });
  await skippedPage.goto("/memory");
  await expect(skippedPage.getByText("0%")).toBeVisible();
  await expect(skippedPage.getByText("0 followed tutors")).toBeVisible();
  await skippedContext.close();
});

test("a normal authenticated learner cannot access admin pages", async ({ page }) => {
  const suffix = Date.now();
  await page.goto("/sign-up");
  await page.getByLabel("Name").fill("Non Admin Learner");
  await page.getByLabel("Email").fill(`non-admin-${suffix}@example.com`);
  await page.getByLabel("Password").fill("Twutor-test-password-46");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL("/onboarding", { timeout: 30_000 });
  await page.getByRole("button", { name: "Skip for now" }).click();
  await expect(page).toHaveURL("/", { timeout: 30_000 });

  await page.goto("/admin/generate");
  await expect(page.getByText("404")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Generated content pipeline" })).toHaveCount(0);
  await page.goto("/admin/intents");
  await expect(page.getByText("404")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Agentic post intents" })).toHaveCount(0);
});
