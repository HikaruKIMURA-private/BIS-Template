import type { FormActionResult } from "../actions/profile";

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { UserForm } from "./UserForm";

vi.mock("../actions/profile", () => ({
  submitProfileForm: vi.fn(),
}));

vi.mock("./ProfileAvatarSection", () => ({
  ProfileAvatarSection: () => null,
}));

const mockAction =
  vi.fn<
    (
      prevState: FormActionResult | undefined,
      formData: FormData
    ) => FormActionResult
  >();

describe("UserForm", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockAction.mockReturnValue(undefined as unknown as FormActionResult);
  });

  afterEach(() => {
    cleanup();
  });

  // --- 単体テスト: レンダリング ---

  it("フォームが正しくレンダリングされる", () => {
    render(<UserForm action={mockAction} />);

    expect(screen.getByText("プロフィール登録")).toBeInTheDocument();
    expect(screen.getByLabelText("名前")).toBeInTheDocument();
    expect(screen.getByText("性別")).toBeInTheDocument();
    expect(screen.getByLabelText("生年月日")).toBeInTheDocument();
    expect(screen.getByLabelText("備考")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存" })).toBeInTheDocument();
  });

  it("性別のラジオボタンが正しく表示される", () => {
    render(<UserForm action={mockAction} />);

    expect(screen.getByText("男性")).toBeInTheDocument();
    expect(screen.getByText("女性")).toBeInTheDocument();
  });

  it("血液型のラジオボタンが正しく表示される", () => {
    render(<UserForm action={mockAction} />);

    expect(screen.getByText("A型")).toBeInTheDocument();
    expect(screen.getByText("B型")).toBeInTheDocument();
    expect(screen.getByText("O型")).toBeInTheDocument();
    expect(screen.getByText("AB型")).toBeInTheDocument();
  });

  // --- 単体テスト: インタラクション ---

  it("血液型を選択できる", async () => {
    const user = userEvent.setup();
    render(<UserForm action={mockAction} />);

    const bloodTypeARadio = screen.getByLabelText("A型");

    await user.click(bloodTypeARadio);

    expect(bloodTypeARadio).toBeChecked();
  });

  it("フォームフィールドに入力できる", async () => {
    const user = userEvent.setup();
    render(<UserForm action={mockAction} />);

    const nameInput = screen.getByLabelText("名前");
    const birthDateInput = screen.getByLabelText("生年月日");
    const noteInput = screen.getByLabelText("備考");

    await user.type(nameInput, "山田太郎");
    await user.type(birthDateInput, "1990-01-15");
    await user.type(noteInput, "よろしくお願いします");

    expect(nameInput).toHaveValue("山田太郎");
    expect(birthDateInput).toHaveValue("1990-01-15");
    expect(noteInput).toHaveValue("よろしくお願いします");
  });

  it("性別を選択できる", async () => {
    const user = userEvent.setup();
    render(<UserForm action={mockAction} />);

    const maleRadio = screen.getByLabelText("男性");

    await user.click(maleRadio);

    expect(maleRadio).toBeChecked();
  });

  // --- 単体テスト: 状態表示 ---

  it("編集モードでは「プロフィール編集」と表示される", () => {
    render(
      <UserForm
        action={mockAction}
        defaultProfile={{
          name: "山田太郎",
          gender: "male",
          birthDate: "1990-01-15",
          note: null,
          bloodType: null,
          avatarUrl: null,
          oauthImageUrl: null,
        }}
      />
    );

    expect(screen.getByText("プロフィール編集")).toBeInTheDocument();
  });

  // --- 結合テスト: バリデーションフロー ---

  describe("バリデーション", () => {
    it("空フォーム送信で名前・性別・生年月日のエラーが表示される", async () => {
      const user = userEvent.setup();
      render(<UserForm action={mockAction} />);

      const submitButton = screen.getByRole("button", { name: "保存" });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("名前は必須です")).toBeInTheDocument();
      });
      expect(screen.getByText("性別を選択してください")).toBeInTheDocument();
      expect(screen.getByText("生年月日は必須です")).toBeInTheDocument();
    });

    it("名前のみ入力して送信すると性別・生年月日のエラーが表示される", async () => {
      const user = userEvent.setup();
      render(<UserForm action={mockAction} />);

      await user.type(screen.getByLabelText("名前"), "テストユーザー");
      await user.click(screen.getByRole("button", { name: "保存" }));

      await waitFor(() => {
        expect(screen.getByText("性別を選択してください")).toBeInTheDocument();
      });
      expect(screen.getByText("生年月日は必須です")).toBeInTheDocument();
      expect(screen.queryByText("名前は必須です")).not.toBeInTheDocument();
    });

    it("名前と性別を入力して送信すると生年月日のエラーのみ表示される", async () => {
      const user = userEvent.setup();
      render(<UserForm action={mockAction} />);

      await user.type(screen.getByLabelText("名前"), "テストユーザー");
      await user.click(screen.getByLabelText("男性"));
      await user.click(screen.getByRole("button", { name: "保存" }));

      await waitFor(() => {
        expect(screen.getByText("生年月日は必須です")).toBeInTheDocument();
      });
      expect(screen.queryByText("名前は必須です")).not.toBeInTheDocument();
      expect(
        screen.queryByText("性別を選択してください")
      ).not.toBeInTheDocument();
    });
  });
});
