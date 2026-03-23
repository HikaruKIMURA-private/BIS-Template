"use client";

import type { ProfileAndSkillSheetActionResult } from "@/app/actions/skill-sheet";
import { formatSkillCareerLine } from "@/libs/skill-sheet/skill-sheet-display";
import type {
  SkillCareerLine,
  SkillSheetValues,
} from "@/libs/skill-sheet/skill-sheet-types";

import { useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod/v3";
import {
  useActionState,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/button";

import {
  type ProfileData,
  profileAndSkillSheetFormSchema,
} from "../schema";
import { ProfileFormFields } from "./ProfileFormFields";
import { SkillSheetFields } from "./SkillSheetFields";

type TabId = "profile" | "skill";

type ProfileEditorTabsProps = {
  defaultProfile?: ProfileData;
  /** サーバーから読み込んだスキルシート（未保存時は null） */
  defaultSkillSheet?: SkillSheetValues | null;
  /** モーダルに表示する「保存済み」経歴（指定時は defaultSkillSheet より優先） */
  savedCareersForModal?: SkillCareerLine[];
  onCancel?: () => void;
  action: (
    prev: ProfileAndSkillSheetActionResult | undefined,
    formData: FormData
  ) => ProfileAndSkillSheetActionResult | Promise<ProfileAndSkillSheetActionResult>;
};

export function ProfileEditorTabs({
  defaultProfile,
  defaultSkillSheet = null,
  savedCareersForModal,
  onCancel,
  action,
}: ProfileEditorTabsProps) {
  const [lastResult, formAction, isPending] = useActionState(action, undefined);
  const [tab, setTab] = useState<TabId>("profile");
  const [careers, setCareers] = useState<SkillCareerLine[]>(
    () => defaultSkillSheet?.careers ?? []
  );
  const [modalOpen, setModalOpen] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  const isEditing = !!defaultProfile;

  const [form, fields] = useForm({
    lastResult,
    defaultValue: {
      name: defaultProfile?.name ?? "",
      gender: defaultProfile?.gender ?? "",
      birthDate: defaultProfile?.birthDate ?? "",
      note: defaultProfile?.note ?? "",
      bloodType: defaultProfile?.bloodType ?? "",
      experienceYears: String(defaultSkillSheet?.experienceYears ?? 0),
      ownedSkills: defaultSkillSheet?.ownedSkills ?? "",
    },
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema: profileAndSkillSheetFormSchema,
      });
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
  });

  const modalCareers = savedCareersForModal ?? defaultSkillSheet?.careers ?? [];

  useEffect(() => {
    if (modalOpen) {
      closeBtnRef.current?.focus();
    }
  }, [modalOpen]);

  function addCareerRow() {
    const y = new Date().getFullYear();
    setCareers((prev) => [
      ...prev,
      {
        startYear: y,
        endYear: y,
        projectName: "",
        summary: "",
        // バリデーション上「使用スキル」は必須のため、行追加時はプレースホルダーを入れる
        skillsUsed: "（入力してください）",
      },
    ]);
  }

  return (
    <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        {isEditing ? "プロフィール・スキルシート編集" : "プロフィール・スキルシート登録"}
      </h2>

      <form
        id={form.id}
        onSubmit={form.onSubmit}
        action={formAction}
        noValidate
      >
        <input type="hidden" name="careersJson" value={JSON.stringify(careers)} />

        <div
          role="tablist"
          aria-label="編集セクション"
          className="mb-4 flex gap-2 border-b border-zinc-200 pb-2 dark:border-zinc-700"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "profile"}
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              tab === "profile"
                ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
            onClick={() => setTab("profile")}
          >
            プロフィール
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "skill"}
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              tab === "skill"
                ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
            onClick={() => setTab("skill")}
          >
            スキルシート
          </button>
        </div>

        <div
          className={tab === "profile" ? "block" : "hidden"}
          data-testid="profile-panel"
        >
          <ProfileFormFields fields={fields} />
        </div>

        <div
          className={tab === "skill" ? "block" : "hidden"}
          data-testid="skill-sheet-panel"
        >
          <SkillSheetFields
            fields={{
              experienceYears: fields.experienceYears,
              ownedSkills: fields.ownedSkills,
            }}
            careers={careers}
            onCareersChange={setCareers}
            onAddCareerRow={addCareerRow}
          />

          <div className="mt-2">
            <button
              type="button"
              className="text-sm text-blue-600 underline dark:text-blue-400"
              onClick={() => setModalOpen(true)}
            >
              経歴を表示
            </button>
          </div>
        </div>

        {form.errors && (
          <div className="mb-4 rounded-md bg-red-50 p-3 dark:bg-red-900/20">
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {form.errors[0]}
            </p>
          </div>
        )}

        {lastResult?.status === "success" && "message" in lastResult && (
          <div className="mb-4 rounded-md bg-green-50 p-3 dark:bg-green-900/20">
            <p
              className="text-sm text-green-600 dark:text-green-400"
              role="alert"
            >
              {lastResult.message}
            </p>
          </div>
        )}

        <div className={onCancel ? "mt-4 flex gap-3" : "mt-4"}>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              キャンセル
            </Button>
          )}
          <Button
            type="submit"
            disabled={isPending}
            className={`${onCancel ? "flex-1" : "w-full"} rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600`}
          >
            {isPending ? "保存中..." : "保存"}
          </Button>
        </div>
      </form>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="presentation"
          onClick={() => setModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="max-h-[80vh] w-full max-w-lg overflow-hidden rounded-lg bg-white p-4 shadow-xl dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id={titleId}
              className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100"
            >
              保存済みの経歴
            </h3>
            <div className="max-h-[50vh] overflow-y-auto text-sm text-zinc-800 dark:text-zinc-200">
              {modalCareers.length === 0 ? (
                <p className="text-zinc-500 dark:text-zinc-400">
                  経歴はまだ登録されていません。
                </p>
              ) : (
                <ul className="list-disc space-y-2 pl-5">
                  {modalCareers.map((line, i) => (
                    <li key={i}>{formatSkillCareerLine(line)}</li>
                  ))}
                </ul>
              )}
            </div>
            <button
              type="button"
              ref={closeBtnRef}
              className="mt-4 rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600"
              onClick={() => setModalOpen(false)}
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
