import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { UserForm } from "./UserForm";

// Server Actionをモック（DB依存を回避）
vi.mock("../actions/profile", () => ({
  submitProfileForm: vi.fn(),
}));

// useActionState をモック
vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    useActionState: vi.fn(),
  };
});

describe("UserForm", () => {
  const getMockUseActionState = async () => {
    const { useActionState } = await import("react");
    return useActionState as ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    cleanup();
    vi.clearAllMocks();

    const mockFn = await getMockUseActionState();
    mockFn.mockReturnValue([
      undefined, // lastResult
      vi.fn(), // formAction
      false, // isPending
    ]);
  });

  afterEach(() => {
    cleanup();
  });

  // --- 単体テスト: レンダリング ---

  it("フォームが正しくレンダリングされる", () => {
    render(<UserForm />);

    expect(screen.getByText("プロフィール登録")).toBeInTheDocument();
    expect(screen.getByLabelText("名前")).toBeInTheDocument();
    expect(screen.getByText("性別")).toBeInTheDocument();
    expect(screen.getByLabelText("生年月日")).toBeInTheDocument();
    expect(screen.getByLabelText("備考")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存" })).toBeInTheDocument();
  });

  it("性別のラジオボタンが正しく表示される", () => {
    render(<UserForm />);

    expect(screen.getByText("男性")).toBeInTheDocument();
    expect(screen.getByText("女性")).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(6);
  });

  it("血液型のラジオボタンが正しく表示される", () => {
    render(<UserForm />);

    expect(screen.getByText("A型")).toBeInTheDocument();
    expect(screen.getByText("B型")).toBeInTheDocument();
    expect(screen.getByText("O型")).toBeInTheDocument();
    expect(screen.getByText("AB型")).toBeInTheDocument();
  });

  // --- 単体テスト: インタラクション ---

  it("血液型を選択できる", async () => {
    const user = userEvent.setup();
    render(<UserForm />);

    const radios = screen.getAllByRole("radio");
    const bloodTypeARadio = radios[2];

    await user.click(bloodTypeARadio);

    expect(bloodTypeARadio).toBeChecked();
  });

  it("フォームフィールドに入力できる", async () => {
    const user = userEvent.setup();
    render(<UserForm />);

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
    render(<UserForm />);

    const radios = screen.getAllByRole("radio");
    const maleRadio = radios[0];

    await user.click(maleRadio);

    expect(maleRadio).toBeChecked();
  });

  // --- 単体テスト: 状態表示 ---

  it("送信中は保存ボタンが無効になる", async () => {
    const mockFn = await getMockUseActionState();
    mockFn.mockReturnValue([
      undefined,
      vi.fn(),
      true, // isPending = true
    ]);

    render(<UserForm />);

    const submitButton = screen.getByRole("button", { name: "保存中..." });
    expect(submitButton).toBeDisabled();
  });

  it("成功メッセージが表示される", async () => {
    const mockFn = await getMockUseActionState();
    mockFn.mockReturnValue([
      {
        status: "success",
        message: "プロフィールを保存しました！",
        value: {
          name: "山田太郎",
          gender: "male",
          birthDate: "1990-01-15",
          note: "",
        },
      },
      vi.fn(),
      false,
    ]);

    render(<UserForm />);

    expect(
      screen.getByText("プロフィールを保存しました！")
    ).toBeInTheDocument();
  });

  it("編集モードでは「プロフィール編集」と表示される", () => {
    render(
      <UserForm
        defaultProfile={{
          name: "山田太郎",
          gender: "male",
          birthDate: "1990-01-15",
          note: null,
          bloodType: null,
        }}
      />
    );

    expect(screen.getByText("プロフィール編集")).toBeInTheDocument();
  });

  // --- 結合テスト: バリデーションフロー（Storybook play 関数から移植） ---

  describe("バリデーション", () => {
    it("空フォーム送信で名前・性別・生年月日のエラーが表示される", async () => {
      const user = userEvent.setup();
      render(<UserForm />);

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
      render(<UserForm />);

      await user.type(screen.getByLabelText("名前"), "テストユーザー");
      await user.click(screen.getByRole("button", { name: "保存" }));

      await waitFor(() => {
        expect(
          screen.getByText("性別を選択してください")
        ).toBeInTheDocument();
      });
      expect(screen.getByText("生年月日は必須です")).toBeInTheDocument();
      expect(screen.queryByText("名前は必須です")).not.toBeInTheDocument();
    });

    it("名前と性別を入力して送信すると生年月日のエラーのみ表示される", async () => {
      const user = userEvent.setup();
      render(<UserForm />);

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
