import { expect, test } from "@playwright/test";

test.describe("Twutor core journeys", () => {
  test("renders the For You learning feed", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Home" })).toBeVisible();
    await expect(page.getByRole("link", { name: "For You" })).toBeVisible();
    await expect(page.getByText("Most teams discover evals after their first embarrassing AI bug.")).toBeVisible();
    await expect(page.getByText("Your learning arc")).toBeVisible();
  });

  test("filters the Following feed to followed tutors", async ({ page }) => {
    await page.goto("/?feed=following");

    await expect(page.getByRole("link", { name: "Following" })).toBeVisible();
    await expect(page.getByText("Showing posts from tutors you follow")).toBeVisible();
    await expect(page.getByText("Most teams discover evals after their first embarrassing AI bug.")).toBeVisible();
    await expect(page.getByText("The model gateway is the new API gateway.")).toBeVisible();
    await expect(page.getByText("Before you build an agent that can do twenty things")).toHaveCount(0);
  });

  test("opens the tutor directory and a tutor profile", async ({ page }) => {
    await page.goto("/tutors");

    await expect(page.getByRole("heading", { name: "Follow the voices you want in your feed" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Maya Chen" }).first()).toBeVisible();

    await page.getByRole("link", { name: "Maya Chen" }).first().click();

    await expect(page).toHaveURL(/\/tutors\/maya$/);
    await expect(page.getByRole("heading", { name: "Maya Chen" }).first()).toBeVisible();
    await expect(page.getByText("The model gateway is the new paved road.")).toBeVisible();
    await expect(page.getByText("Teaching style")).toBeVisible();
  });

  test("shows saved models as a dedicated feed", async ({ page }) => {
    await page.goto("/saved");

    await expect(page.getByRole("heading", { name: "Saved Models" })).toBeVisible();
    await expect(page.getByText("Showing posts you saved")).toBeVisible();
    await expect(page.getByText("The model gateway is the new API gateway.")).toBeVisible();
  });

  test("exposes the guarded agentic intents admin surface in dev", async ({ page }) => {
    const consoleMessages: string[] = [];
    page.on("console", (message) => consoleMessages.push(message.text()));

    await page.goto("/admin/intents");

    await expect(page.getByRole("heading", { name: "Agentic post intents" })).toBeVisible();
    await expect(page.getByText("Dev admin · guarded route")).toBeVisible();
    await expect(page.getByText("Publish guard: published post id is required").first()).toBeVisible();
    expect(consoleMessages.join("\n")).not.toContain("Encountered two children with the same key");
  });
});
