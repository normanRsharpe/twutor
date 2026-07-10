import { expect, test } from "@playwright/test";

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

  await expect(page).toHaveURL("/", { timeout: 30_000 });
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
