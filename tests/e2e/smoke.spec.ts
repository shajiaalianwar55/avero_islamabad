import { test, expect } from "@playwright/test";

test("emergency path overrides immediately", async ({ page }) => {
  await page.goto("/incident/new");
  await page.getByLabel("What is wrong?").fill("Socket buzzing and burning smell");
  await page.getByRole("button", { name: "Start triage" }).click();
  await expect(page.getByText(/Emergency|Stop troubleshooting/i)).toBeVisible({
    timeout: 30000,
  });
});

test("technician sink leak reaches decision", async ({ page }) => {
  await page.goto("/incident/new");
  await page.getByLabel("What is wrong?").fill("There is water under my kitchen sink.");
  await page.getByRole("button", { name: "Start triage" }).click();
  await expect(page.getByText(/Safety:/i)).toBeVisible({ timeout: 30000 });
});
