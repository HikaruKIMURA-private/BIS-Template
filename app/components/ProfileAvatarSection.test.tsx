import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProfileAvatarSection } from "./ProfileAvatarSection";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("../actions/profile-avatar", () => ({
  setProfileAvatar: vi.fn(),
  clearProfileAvatar: vi.fn(),
}));

const mockUseActionState = vi.fn();

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    useActionState: (...args: unknown[]) => mockUseActionState(...args),
  };
});

describe("ProfileAvatarSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseActionState
      .mockReturnValueOnce([undefined, vi.fn(), false])
      .mockReturnValueOnce([undefined, vi.fn(), false]);
  });

  it("enabled が false のときは何も表示しない", () => {
    const { container } = render(<ProfileAvatarSection enabled={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("制約ヘルプとファイル入力を表示する", () => {
    render(<ProfileAvatarSection enabled />);

    expect(
      screen.getByText(/JPEG \/ PNG \/ WebP/i, { exact: false })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/プロフィール画像ファイル/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "アップロード" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "画像を削除" })).toBeInTheDocument();
  });

  it("アップロード送信中はボタンを無効化する", () => {
    mockUseActionState.mockReset();
    mockUseActionState
      .mockReturnValueOnce([undefined, vi.fn(), true])
      .mockReturnValueOnce([undefined, vi.fn(), false]);

    render(<ProfileAvatarSection enabled />);

    expect(screen.getByRole("button", { name: "アップロード中..." })).toBeDisabled();
  });
});
