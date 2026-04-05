import type { ProfileAndSkillSheetActionResult } from "@/app/actions/skill-sheet";

import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { ProfileEditorTabs } from "./ProfileEditorTabs";

/**
 * プロフィール編集とスキルシート編集のタブ切替・共通保存・経歴モーダル・動的行。
 */
describe("ProfileEditorTabs（仮称）", () => {
  const defaultProfile = {
    name: "山田",
    gender: "male" as const,
    birthDate: "1990-01-01",
    note: "",
    bloodType: null,
    avatarUrl: null,
  };

  const defaultSkillSheet = {
    experienceYears: 3,
    ownedSkills: "Go",
    careers: [
      {
        startYear: 2020,
        endYear: 2021,
        projectName: "社内基盤",
        summary: "詳細",
        skillsUsed: "Go",
      },
    ],
  };

  const captured: FormData[] = [];

  function captureAction(
    _prev: ProfileAndSkillSheetActionResult | undefined,
    fd: FormData
  ): ProfileAndSkillSheetActionResult {
    captured.push(fd);
    return undefined as unknown as ProfileAndSkillSheetActionResult;
  }

  beforeEach(() => {
    cleanup();
    captured.length = 0;
  });

  describe("タブ切替", () => {
    it("スキルシートタブを選んだとき、スキルシート用フィールドが表示されること", async () => {
      const user = userEvent.setup();
      render(
        <ProfileEditorTabs
          action={captureAction}
          defaultProfile={defaultProfile}
          defaultSkillSheet={defaultSkillSheet}
        />
      );

      await user.click(screen.getByRole("tab", { name: "スキルシート" }));

      expect(screen.getByLabelText("所有スキル")).toBeInTheDocument();
      expect(screen.getByLabelText("経験年数（年）")).toBeInTheDocument();
    });

    it("プロフィールタブを選んだとき、プロフィール用フィールドが表示されること", async () => {
      const user = userEvent.setup();
      render(
        <ProfileEditorTabs
          action={captureAction}
          defaultProfile={defaultProfile}
          defaultSkillSheet={defaultSkillSheet}
        />
      );

      await user.click(screen.getByRole("tab", { name: "スキルシート" }));
      await user.click(screen.getByRole("tab", { name: "プロフィール" }));

      expect(screen.getByLabelText("名前")).toBeInTheDocument();
      expect(screen.getByLabelText("生年月日")).toBeInTheDocument();
    });

    it("タブを往復しても、編集中の入力値が失われないこと", async () => {
      const user = userEvent.setup();
      render(
        <ProfileEditorTabs
          action={captureAction}
          defaultProfile={defaultProfile}
          defaultSkillSheet={defaultSkillSheet}
        />
      );

      const nameInput = screen.getByLabelText("名前");
      await user.clear(nameInput);
      await user.type(nameInput, "保存値テスト");

      await user.click(screen.getByRole("tab", { name: "スキルシート" }));
      await user.click(screen.getByRole("tab", { name: "プロフィール" }));

      expect(screen.getByLabelText("名前")).toHaveValue("保存値テスト");
    });
  });

  describe("共通の保存ボタン", () => {
    it("どちらのタブを表示中でも、同じラベルの保存ボタンが1つだけ存在すること", async () => {
      const user = userEvent.setup();
      render(
        <ProfileEditorTabs
          action={captureAction}
          defaultProfile={defaultProfile}
          defaultSkillSheet={defaultSkillSheet}
        />
      );

      expect(screen.getAllByRole("button", { name: "保存" })).toHaveLength(1);

      await user.click(screen.getByRole("tab", { name: "スキルシート" }));

      expect(screen.getAllByRole("button", { name: "保存" })).toHaveLength(1);
    });

    it("スキルシートタブ表示中に保存を押したとき、プロフィールとスキルシートの入力がまとめて送信対象になること", async () => {
      const user = userEvent.setup();
      render(
        <ProfileEditorTabs
          action={captureAction}
          defaultProfile={defaultProfile}
          defaultSkillSheet={defaultSkillSheet}
        />
      );

      await user.click(screen.getByRole("tab", { name: "スキルシート" }));
      await user.clear(screen.getByLabelText("所有スキル"));
      await user.type(screen.getByLabelText("所有スキル"), "Rust");

      await user.click(screen.getByRole("button", { name: "保存" }));

      await waitFor(() => {
        expect(captured.length).toBeGreaterThan(0);
      });

      const fd = captured[captured.length - 1];
      expect(fd.get("name")).toBe("山田");
      expect(fd.get("ownedSkills")).toBe("Rust");
      expect(fd.get("careersJson")).toBeTruthy();
    });
  });

  describe("経歴表示モーダル（プロフィール表示画面）", () => {
    it("経歴表示ボタンが存在し、押下でモーダルが開くこと", async () => {
      const user = userEvent.setup();
      render(
        <ProfileEditorTabs
          action={captureAction}
          defaultProfile={defaultProfile}
          defaultSkillSheet={defaultSkillSheet}
        />
      );

      await user.click(screen.getByRole("tab", { name: "スキルシート" }));
      await user.click(screen.getByRole("button", { name: "経歴を表示" }));

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("モーダルが開いているとき、保存済みの経歴内容が読めること", async () => {
      const user = userEvent.setup();
      render(
        <ProfileEditorTabs
          action={captureAction}
          defaultProfile={defaultProfile}
          defaultSkillSheet={defaultSkillSheet}
          savedCareersForModal={[
            {
              startYear: 2018,
              endYear: 2019,
              projectName: "表示専用",
              summary: "モーダル確認",
              skillsUsed: "TS",
            },
          ]}
        />
      );

      await user.click(screen.getByRole("tab", { name: "スキルシート" }));
      await user.click(screen.getByRole("button", { name: "経歴を表示" }));

      expect(screen.getByText(/表示専用/)).toBeInTheDocument();
      expect(screen.getByText(/モーダル確認/)).toBeInTheDocument();
    });

    it("閉じる操作でモーダルが閉じること", async () => {
      const user = userEvent.setup();
      render(
        <ProfileEditorTabs
          action={captureAction}
          defaultProfile={defaultProfile}
          defaultSkillSheet={defaultSkillSheet}
        />
      );

      await user.click(screen.getByRole("tab", { name: "スキルシート" }));
      await user.click(screen.getByRole("button", { name: "経歴を表示" }));

      await user.click(screen.getByRole("button", { name: "閉じる" }));

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("経歴が空のとき、空であることがユーザーに伝わる表示であること", async () => {
      const user = userEvent.setup();
      render(
        <ProfileEditorTabs
          action={captureAction}
          defaultProfile={defaultProfile}
          defaultSkillSheet={{ experienceYears: 0, ownedSkills: "a", careers: [] }}
          savedCareersForModal={[]}
        />
      );

      await user.click(screen.getByRole("tab", { name: "スキルシート" }));
      await user.click(screen.getByRole("button", { name: "経歴を表示" }));

      expect(
        screen.getByText("経歴はまだ登録されていません。")
      ).toBeInTheDocument();
    });
  });

  describe("経歴行の追加（一行ずつ追加）", () => {
    it("行を追加すると、新しい入力欄のセットが1行分増えること", async () => {
      const user = userEvent.setup();
      render(
        <ProfileEditorTabs
          action={captureAction}
          defaultProfile={defaultProfile}
          defaultSkillSheet={{ experienceYears: 1, ownedSkills: "a", careers: [] }}
        />
      );

      await user.click(screen.getByRole("tab", { name: "スキルシート" }));
      const skillPanel = screen.getByTestId("skill-sheet-panel");
      expect(within(skillPanel).queryAllByText(/^経歴 \d+$/)).toHaveLength(0);

      await user.click(screen.getByRole("button", { name: "経歴を追加" }));

      expect(within(skillPanel).getAllByText(/^経歴 \d+$/)).toHaveLength(1);
    });

    it("複数回追加すると、行数がその回数だけ増えること", async () => {
      const user = userEvent.setup();
      render(
        <ProfileEditorTabs
          action={captureAction}
          defaultProfile={defaultProfile}
          defaultSkillSheet={{ experienceYears: 1, ownedSkills: "a", careers: [] }}
        />
      );

      await user.click(screen.getByRole("tab", { name: "スキルシート" }));
      await user.click(screen.getByRole("button", { name: "経歴を追加" }));
      await user.click(screen.getByRole("button", { name: "経歴を追加" }));

      const skillPanel = screen.getByTestId("skill-sheet-panel");
      expect(within(skillPanel).getAllByText(/^経歴 \d+$/)).toHaveLength(2);
    });

    it("各行に独立して入力でき、保存に反映されること", async () => {
      const user = userEvent.setup();
      render(
        <ProfileEditorTabs
          action={captureAction}
          defaultProfile={defaultProfile}
          defaultSkillSheet={{ experienceYears: 1, ownedSkills: "a", careers: [] }}
        />
      );

      await user.click(screen.getByRole("tab", { name: "スキルシート" }));
      await user.click(screen.getByRole("button", { name: "経歴を追加" }));
      await user.click(screen.getByRole("button", { name: "経歴を追加" }));

      const skillPanel = screen.getByTestId("skill-sheet-panel");
      const fieldsets = within(skillPanel).getAllByRole("group");
      const row1 = fieldsets[0];
      const row2 = fieldsets[1];

      await user.type(within(row1).getByLabelText("プロジェクト名"), "A1");
      await user.type(within(row2).getByLabelText("プロジェクト名"), "B2");

      await user.click(screen.getByRole("button", { name: "保存" }));

      await waitFor(() => {
        expect(captured.length).toBeGreaterThan(0);
      });

      const raw = captured[captured.length - 1].get("careersJson");
      expect(raw).toBeTruthy();
      const careers = JSON.parse(String(raw)) as { projectName: string }[];
      expect(careers.map((c) => c.projectName)).toEqual(
        expect.arrayContaining(["A1", "B2"])
      );
    });
  });

  describe("アクセシビリティ", () => {
    it("経験年数プルダウンにアクセシブル名が関連付けられていること", () => {
      render(
        <ProfileEditorTabs
          action={captureAction}
          defaultProfile={defaultProfile}
          defaultSkillSheet={defaultSkillSheet}
        />
      );

      expect(screen.getByLabelText("経験年数（年）")).toBeInTheDocument();
    });

    it("モーダルが開いたとき、フォーカスがモーダル内に移ること", async () => {
      const user = userEvent.setup();
      render(
        <ProfileEditorTabs
          action={captureAction}
          defaultProfile={defaultProfile}
          defaultSkillSheet={defaultSkillSheet}
        />
      );

      await user.click(screen.getByRole("tab", { name: "スキルシート" }));
      await user.click(screen.getByRole("button", { name: "経歴を表示" }));

      await waitFor(() => {
        const closeBtn = screen.getByRole("button", { name: "閉じる" });
        expect(closeBtn).toHaveFocus();
      });
    });
  });
});
