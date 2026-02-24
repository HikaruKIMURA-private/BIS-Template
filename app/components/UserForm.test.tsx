import { cleanup, render, screen } from "@testing-library/react";
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

    // useActionState のデフォルトの戻り値を設定
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
    // ラジオボタンが2つ存在することを確認
    expect(screen.getAllByRole("radio")).toHaveLength(2);
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
    const maleRadio = radios[0]; // 最初のラジオボタン（男性）

    await user.click(maleRadio);

    expect(maleRadio).toBeChecked();
  });

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
});
