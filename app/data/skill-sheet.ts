import { eq } from "drizzle-orm";

import { db, type DbExecutor } from "@/db";
import { skillSheet } from "@/db/schema";
import type { SkillSheetValues } from "@/libs/skill-sheet/skill-sheet-types";

export async function getSkillSheet(
  userId: string,
  executor: DbExecutor = db
): Promise<SkillSheetValues | null> {
  const rows = await executor
    .select({
      experienceYears: skillSheet.experienceYears,
      ownedSkills: skillSheet.ownedSkills,
      careers: skillSheet.careers,
    })
    .from(skillSheet)
    .where(eq(skillSheet.userId, userId))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    experienceYears: row.experienceYears,
    ownedSkills: row.ownedSkills,
    careers: row.careers,
  };
}

export async function upsertSkillSheet(
  userId: string,
  data: SkillSheetValues,
  executor: DbExecutor = db
) {
  const existing = await executor
    .select({ id: skillSheet.id })
    .from(skillSheet)
    .where(eq(skillSheet.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    await executor
      .update(skillSheet)
      .set({
        experienceYears: data.experienceYears,
        ownedSkills: data.ownedSkills,
        careers: data.careers,
      })
      .where(eq(skillSheet.userId, userId));
  } else {
    await executor.insert(skillSheet).values({
      id: crypto.randomUUID(),
      userId,
      experienceYears: data.experienceYears,
      ownedSkills: data.ownedSkills,
      careers: data.careers,
    });
  }
}
