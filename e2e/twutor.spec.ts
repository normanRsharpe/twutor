import { expect, test } from "@playwright/test";

test.describe("Twutor core journeys", () => {
  test.describe.configure({ mode: "serial" });

  test("renders the For You learning feed", async ({ page }) => {
    await page.goto("/?reset=1");

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

  test("persists learner saves, tutor follows, and private memory notes", async ({ page }) => {
    await page.goto("/");

    await page
      .locator("article")
      .filter({ hasText: "A useful AI trace should answer" })
      .getByRole("button", { name: "Save post" })
      .click();

    await page.goto("/tutors");
    await page
      .locator("article")
      .filter({ hasText: "Nora Context" })
      .getByRole("button", { name: "Follow" })
      .click();

    await page.goto("/memory");

    await expect(page.getByRole("heading", { name: "Learner memory" })).toBeVisible();
    await expect(page.getByText("3 saved posts")).toBeVisible();
    await expect(page.getByText("3 followed tutors")).toBeVisible();
    await expect(page.getByText("Nora Context")).toBeVisible();

    await page.getByLabel("Private learning note").fill("Need to revisit citation quality before agents.");
    await page.getByRole("button", { name: "Save note" }).click();

    await expect(page.getByText("Need to revisit citation quality before agents.")).toBeVisible();
  });

  test("creates a mocked OpenAI tutor thread from the Ask composer", async ({ page }) => {
    await page.goto("/");

    await page.getByLabel("Ask the tutor council").fill("How should I evaluate a model gateway before launch?");
    await page.getByRole("button", { name: "Ask tutors" }).click();

    await expect(page).toHaveURL(/\/replies/);
    await expect(page.getByRole("heading", { name: "Tutor Replies" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "How should I evaluate a model gateway before launch?" })).toBeVisible();
    await expect(page.getByText("Mocked OpenAI draft", { exact: true })).toBeVisible();
    await expect(page.getByText("Start with the smallest eval that can block a bad launch")).toBeVisible();
    await expect(page.getByText("Ask a follow-up or turn this into a build-lab challenge.")).toBeVisible();
  });

  test("generates, reviews, and publishes mocked OpenAI content from admin", async ({ page }) => {
    await page.goto("/admin/generate");

    await expect(page.getByRole("heading", { name: "Generated content pipeline" })).toBeVisible();
    await page.getByLabel("Draft theme").fill("Model gateway launch checklist");
    await page.getByRole("button", { name: "Generate draft" }).click();

    await expect(page).toHaveURL(/\/admin\/generate/);
    await expect(page.getByText("Mocked OpenAI draft", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Model gateway launch checklist" })).toBeVisible();
    await expect(page.getByText("provider=mock-openai")).toBeVisible();

    await page.getByRole("button", { name: "Publish to feed" }).click();
    await expect(page.getByText("published", { exact: true }).first()).toBeVisible();

    await page.goto("/");
    await expect(page.getByText("Model gateway launch checklist")).toBeVisible();
  });

  test("persists social replies, reposts, checks, poll votes, and activity-backed trends", async ({ page }) => {
    await page.goto("/");

    const pollPost = page.locator("article").filter({ hasText: "Poll: your RAG bot is hallucinating" });
    await pollPost.getByRole("button", { name: "Reply to post" }).click();
    await pollPost.getByRole("button", { name: "Repost post" }).click();
    await pollPost.getByRole("button", { name: "Check post" }).click();
    await pollPost.getByRole("button", { name: "Quote tutor post" }).click();
    await pollPost.getByRole("button", { name: "Vote Retrieved context" }).click();

    await expect(page.getByText("Your poll vote was saved")).toBeVisible();
    await expect(page.getByText("Your reply joined a tutor thread").first()).toBeVisible();
    await expect(page.getByText("Your quote-tutor post is ready").first()).toBeVisible();
    await expect(page.getByText("1 learner").first()).toBeVisible();
    await expect(page.getByText("Poll: your RAG bot is hallucinating. What do you check first?").first()).toBeVisible();
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
