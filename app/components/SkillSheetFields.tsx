import type { FieldMetadata } from "@conform-to/react";
import { getSelectProps, getTextareaProps } from "@conform-to/react";

import { MAX_EXPERIENCE_YEARS } from "@/libs/skill-sheet/skill-sheet-constants";
import type { SkillCareerLine } from "@/libs/skill-sheet/skill-sheet-types";

const inputClass =
  "w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-blue-400 dark:focus:ring-blue-400";

type SkillSheetFieldsProps = {
  fields: {
    experienceYears: FieldMetadata<string | number>;
    ownedSkills: FieldMetadata<string>;
  };
  careers: SkillCareerLine[];
  onCareersChange: (next: SkillCareerLine[]) => void;
  onAddCareerRow: () => void;
};

export function SkillSheetFields({
  fields,
  careers,
  onCareersChange,
  onAddCareerRow,
}: SkillSheetFieldsProps) {
  function updateRow(index: number, patch: Partial<SkillCareerLine>) {
    const next = careers.map((row, i) =>
      i === index ? { ...row, ...patch } : row
    );
    onCareersChange(next);
  }

  const yearOptions = Array.from({ length: MAX_EXPERIENCE_YEARS + 1 }, (_, i) => i);

  return (
    <div className="space-y-6">
      <div>
        <label
          htmlFor={fields.experienceYears.id}
          className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          経験年数（年）
        </label>
        <select
          {...getSelectProps(fields.experienceYears)}
          className={inputClass}
        >
          {yearOptions.map((y) => (
            <option key={y} value={String(y)}>
              {y}
            </option>
          ))}
        </select>
        {fields.experienceYears.errors &&
          fields.experienceYears.errors.length > 0 && (
            <p
              id={`${fields.experienceYears.id}-error`}
              className="mt-1 text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {fields.experienceYears.errors[0]}
            </p>
          )}
      </div>

      <div>
        <label
          htmlFor={fields.ownedSkills.id}
          className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          所有スキル
        </label>
        <textarea
          {...getTextareaProps(fields.ownedSkills)}
          placeholder="例: TypeScript, React, PostgreSQL"
          rows={4}
          className={inputClass}
        />
        {fields.ownedSkills.errors && fields.ownedSkills.errors.length > 0 && (
          <p
            id={`${fields.ownedSkills.id}-error`}
            className="mt-1 text-sm text-red-600 dark:text-red-400"
            role="alert"
          >
            {fields.ownedSkills.errors[0]}
          </p>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            経歴
          </span>
          <button
            type="button"
            onClick={onAddCareerRow}
            className="rounded-md border border-zinc-300 px-3 py-1 text-sm text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            経歴を追加
          </button>
        </div>
        <div className="space-y-4">
          {careers.map((row, index) => (
            <fieldset
              key={index}
              className="rounded-md border border-zinc-200 p-3 dark:border-zinc-700"
            >
              <legend className="px-1 text-xs text-zinc-500">
                経歴 {index + 1}
              </legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <label className="block text-xs text-zinc-600 dark:text-zinc-400">
                  開始年
                  <input
                    type="number"
                    value={row.startYear}
                    onChange={(e) =>
                      updateRow(index, {
                        startYear: Number.parseInt(e.target.value, 10) || 1900,
                      })
                    }
                    className={`${inputClass} mt-1`}
                  />
                </label>
                <label className="block text-xs text-zinc-600 dark:text-zinc-400">
                  終了年
                  <input
                    type="number"
                    value={row.endYear}
                    onChange={(e) =>
                      updateRow(index, {
                        endYear: Number.parseInt(e.target.value, 10) || 1900,
                      })
                    }
                    className={`${inputClass} mt-1`}
                  />
                </label>
              </div>
              <label className="mt-2 block text-xs text-zinc-600 dark:text-zinc-400">
                プロジェクト名
                <input
                  type="text"
                  value={row.projectName}
                  onChange={(e) =>
                    updateRow(index, { projectName: e.target.value })
                  }
                  className={`${inputClass} mt-1`}
                />
              </label>
              <label className="mt-2 block text-xs text-zinc-600 dark:text-zinc-400">
                概要
                <textarea
                  value={row.summary}
                  onChange={(e) =>
                    updateRow(index, { summary: e.target.value })
                  }
                  rows={5}
                  placeholder="担当・成果・技術スタックなど"
                  className={`${inputClass} mt-1 min-h-[7.5rem] resize-y`}
                />
              </label>
              <label className="mt-2 block text-xs text-zinc-600 dark:text-zinc-400">
                使用スキル
                <input
                  type="text"
                  value={row.skillsUsed}
                  onChange={(e) =>
                    updateRow(index, { skillsUsed: e.target.value })
                  }
                  className={`${inputClass} mt-1`}
                />
              </label>
            </fieldset>
          ))}
        </div>
      </div>
    </div>
  );
}
