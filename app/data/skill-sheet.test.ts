import { describe, it } from "vitest";

/**
 * スキルシートの取得・永続化（実装時の関数名に合わせて describe をリネーム）。
 * postgres_test を用いた結合テスト向け。本文は it.todo のみ。
 */
describe("getSkillSheet / upsertSkillSheet（仮称）", () => {
  // 初回ユーザーや未作成時の既定を固定する
  it.todo(
    "スキルシートが未保存のユーザーのとき、null または空の既定値が返ること"
  );

  // 書き込みと読み取りの対応を保証する
  it.todo(
    "有効なデータを保存したあと、同じ userId で取得すると保存内容が一致すること"
  );

  // 更新の上書き挙動を保証する
  it.todo(
    "既存データがある状態で更新すると、旧値が上書きされ取得結果が新値になること"
  );

  // userId スコープの分離を保証する
  it.todo("他ユーザーのデータが混入しないこと");
});
