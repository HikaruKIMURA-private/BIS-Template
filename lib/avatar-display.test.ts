import { describe, expect, it } from "vitest";

import { resolveAvatarImageUrl } from "./avatar-display";

describe("resolveAvatarImageUrl", () => {
  it("カスタム URL を最優先する", () => {
    expect(
      resolveAvatarImageUrl("https://storage.example/a.png", "https://gh/1.jpg")
    ).toBe("https://storage.example/a.png");
  });

  it("カスタムが無いときはセッション画像を使う", () => {
    expect(resolveAvatarImageUrl(null, "https://gh/1.jpg")).toBe(
      "https://gh/1.jpg"
    );
  });

  it("空文字のカスタムはフォールバックへ回す", () => {
    expect(resolveAvatarImageUrl("", "https://gh/1.jpg")).toBe(
      "https://gh/1.jpg"
    );
  });

  it("どちらも無いときは null", () => {
    expect(resolveAvatarImageUrl(null, null)).toBeNull();
  });
});
