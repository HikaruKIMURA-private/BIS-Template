import { expect, test } from "@playwright/test";

test.describe.serial("プロフィール編集", () => {
  test("プロフィールを新規作成できること", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "保存" }).waitFor();

    await page.getByRole("textbox", { name: "名前" }).fill("テスト");
    await page.getByRole("radio", { name: "AB型" }).check();
    await page.getByRole("radio", { name: "女性" }).check();
    await page.getByRole("textbox", { name: "生年月日" }).fill("2000-01-15");
    await page.getByRole("textbox", { name: "備考" }).fill("テストe2e");
    await page.getByRole("button", { name: "保存" }).click();

    await expect(
      page.getByRole("heading", { name: "プロフィール" })
    ).toBeVisible();
    await expect(page.getByText("テスト")).toBeVisible();
    await expect(page.getByText("AB型")).toBeVisible();
    await expect(page.getByText("女性")).toBeVisible();
    await expect(page.getByText("テストe2e")).toBeVisible();
  });

  test("プロフィールを編集できること", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "編集" }).click();
    await page.getByRole("button", { name: "保存" }).waitFor();

    await page.getByRole("textbox", { name: "名前" }).fill("更新ユーザー");
    await page.getByRole("radio", { name: "B型", exact: true }).check();
    await page.getByRole("textbox", { name: "備考" }).fill("更新済み");
    await page.getByRole("button", { name: "保存" }).click();

    await expect(
      page.getByRole("heading", { name: "プロフィール" })
    ).toBeVisible();
    await expect(page.getByText("更新ユーザー")).toBeVisible();
    await expect(page.getByText("B型")).toBeVisible();
    await expect(page.getByText("更新済み")).toBeVisible();
  });
});
