import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProfileCard } from "./ProfileCard";

vi.mock("../actions/avatar", () => ({
  submitAvatarForm: vi.fn(),
  removeAvatarForm: vi.fn(),
}));

vi.mock("../actions/profile", () => ({
  submitProfileForm: vi.fn(),
}));

vi.mock("next/image", () => ({
  default: function MockImage({
    src,
    alt,
    ...rest
  }: {
    src: string;
    alt: string;
    className?: string;
  }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...rest} />;
  },
}));

describe("ProfileCard", () => {
  afterEach(() => {
    cleanup();
  });

  const baseProfile = {
    name: "山田太郎",
    gender: "male" as const,
    birthDate: "1990-01-15",
    note: null as string | null,
    bloodType: null as string | null,
    avatarUrl: null as string | null,
  };

  it("画像が無いときは名前の頭文字を表示する", () => {
    render(<ProfileCard profile={baseProfile} />);

    expect(screen.getByText("山")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("profile.avatarUrl があるときはその画像を表示する", () => {
    render(
      <ProfileCard
        profile={{
          ...baseProfile,
          avatarUrl: "https://example.com/me.png",
        }}
      />
    );

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "https://example.com/me.png");
  });

  it("カスタムが無くて sessionFallbackImage があるときはフォールバック画像を表示する", () => {
    render(
      <ProfileCard
        profile={baseProfile}
        sessionFallbackImage="https://avatars.githubusercontent.com/u/1?v=4"
      />
    );

    const img = screen.getByRole("img");
    expect(img.getAttribute("src")).toContain("avatars.githubusercontent.com");
  });

  it("プレビューではアバターアップロード UI を出さない", () => {
    render(
      <ProfileCard
        profile={{
          ...baseProfile,
          avatarUrl: "https://example.com/me.png",
        }}
      />
    );

    expect(
      screen.queryByRole("heading", { name: "アバター画像" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "アップロード" })
    ).not.toBeInTheDocument();
  });

  it("編集モードではアバターアップロード UI を表示する", async () => {
    const user = userEvent.setup();
    render(<ProfileCard profile={baseProfile} />);

    await user.click(screen.getByRole("button", { name: "編集" }));

    expect(
      screen.getByRole("heading", { name: "アバター画像" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "アップロード" })
    ).toBeInTheDocument();
  });
});
