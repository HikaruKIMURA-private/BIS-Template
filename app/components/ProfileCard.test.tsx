import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ProfileData } from "../schema";

import { ProfileCard } from "./ProfileCard";

vi.mock("../actions/profile", () => ({
  submitProfileForm: vi.fn(),
}));

vi.mock("./ProfileAvatarSection", () => ({
  ProfileAvatarSection: () => null,
}));

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    onError,
  }: {
    src: string;
    alt: string;
    onError?: () => void;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element -- テスト用スタブ
    <img src={src} alt={alt} data-testid="next-image" onError={onError} />
  ),
}));

const baseProfile: ProfileData = {
  name: "山田太郎",
  gender: "male",
  birthDate: "1990-01-15",
  note: null,
  bloodType: null,
  avatarUrl: null,
  oauthImageUrl: null,
};

describe("ProfileCard", () => {
  afterEach(() => {
    cleanup();
  });

  it("画像 URL が無いときはイニシャルのプレースホルダーを表示する", () => {
    render(<ProfileCard profile={baseProfile} />);

    expect(screen.getByText("山")).toBeInTheDocument();
    expect(screen.queryByTestId("next-image")).not.toBeInTheDocument();
  });

  it("avatarUrl があるときは next/image で表示する", () => {
    render(
      <ProfileCard
        profile={{
          ...baseProfile,
          avatarUrl:
            "https://ex.test/storage/v1/object/public/bkt/u/a.png",
        }}
      />
    );

    const img = screen.getByTestId("next-image");
    expect(img).toHaveAttribute(
      "src",
      "https://ex.test/storage/v1/object/public/bkt/u/a.png"
    );
  });

  it("avatarUrl が無く oauthImageUrl のみのときは img で表示する", () => {
    const { container } = render(
      <ProfileCard
        profile={{
          ...baseProfile,
          oauthImageUrl: "https://avatars.example.com/x.png",
        }}
      />
    );

    const img = container.querySelector(
      'img[src="https://avatars.example.com/x.png"]'
    );
    expect(img).toBeTruthy();
  });

  it("画像の onError でプレースホルダーに切り替わる", () => {
    const { container } = render(
      <ProfileCard
        profile={{
          ...baseProfile,
          avatarUrl:
            "https://ex.test/storage/v1/object/public/bkt/u/a.png",
        }}
      />
    );

    const img = container.querySelector('[data-testid="next-image"]');
    expect(img).toBeTruthy();
    fireEvent.error(img!);

    expect(screen.getByText("山")).toBeInTheDocument();
  });
});
