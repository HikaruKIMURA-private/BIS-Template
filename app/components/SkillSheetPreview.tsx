import { formatSkillCareerLine } from "@/libs/skill-sheet/skill-sheet-display";
import type { SkillSheetValues } from "@/libs/skill-sheet/skill-sheet-types";

type SkillSheetPreviewProps = {
  skillSheet: SkillSheetValues | null;
};

export function SkillSheetPreview({ skillSheet }: SkillSheetPreviewProps) {
  return (
    <section
      className="mt-8 border-t border-zinc-200 pt-8 dark:border-zinc-700"
      aria-labelledby="skill-sheet-preview-heading"
    >
      <h3
        id="skill-sheet-preview-heading"
        className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100"
      >
        スキルシート
      </h3>

      {!skillSheet ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          スキルシートはまだ登録されていません。
        </p>
      ) : (
        <dl className="space-y-5 text-sm">
          <div>
            <dt className="font-medium text-zinc-500 dark:text-zinc-400">
              経験年数
            </dt>
            <dd className="mt-1 text-zinc-900 dark:text-zinc-100">
              {skillSheet.experienceYears} 年
            </dd>
          </div>

          <div>
            <dt className="font-medium text-zinc-500 dark:text-zinc-400">
              所有スキル
            </dt>
            <dd className="mt-1 whitespace-pre-wrap text-zinc-900 dark:text-zinc-100">
              {skillSheet.ownedSkills}
            </dd>
          </div>

          <div>
            <dt className="mb-2 font-medium text-zinc-500 dark:text-zinc-400">
              経歴
            </dt>
            <dd>
              {skillSheet.careers.length === 0 ? (
                <p className="text-zinc-500 dark:text-zinc-400">
                  経歴は登録されていません。
                </p>
              ) : (
                <ul className="list-none space-y-3">
                  {skillSheet.careers.map((line, i) => (
                    <li
                      key={i}
                      className="rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-200"
                    >
                      {formatSkillCareerLine(line)}
                    </li>
                  ))}
                </ul>
              )}
            </dd>
          </div>
        </dl>
      )}
    </section>
  );
}
