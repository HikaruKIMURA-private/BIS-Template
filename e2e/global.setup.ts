import { expect, test as setup } from "@playwright/test";

// Cookie と localStorage を JSON に保存するパス
// 認証済みテスト（e2e/authed/）はこのファイルを storageState として読み込む
const authFile = "e2e/.auth/user.json";

const generateUniqueEmail = () =>
  `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.com`;

setup("ユーザーを作成してログイン状態を保存", async ({ page }) => {
  const testEmail = generateUniqueEmail();
  const testPassword = "testpassword123";

  await page.goto("/signup");
  await page.getByRole("textbox", { name: "名前" }).fill("E2Eテストユーザー");
  await page.getByRole("textbox", { name: "メールアドレス" }).fill(testEmail);
  await page.getByLabel("パスワード", { exact: true }).fill(testPassword);
  await page.getByLabel("パスワード（確認）").fill(testPassword);
  await page.getByRole("button", { name: "登録", exact: true }).click();

  await page.waitForURL("/dashboard");
  await expect(page).toHaveURL("/dashboard");

  // ブラウザの Cookie（セッショントークン等）と localStorage を JSON ファイルに保存
  // 各テストはこの状態を復元して認証済みで開始する
  await page.context().storageState({ path: authFile });
});
