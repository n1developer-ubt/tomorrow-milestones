import { expect, test } from "@playwright/test";

test("staff can open the new plan form from the plans page", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Milestone plans" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "New plan" }).first().click();

  await expect(
    page.getByRole("heading", { name: "New milestone plan" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Generate milestones" }).click();
  await expect(page.getByText("Title is too short")).toBeVisible();
});
