import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "@/db";
import { profile, user } from "@/db/schema";
import { getUserProfile } from "./profile";

const TEST_USER_ID = "test-user-get-profile";
const TEST_EMAIL = "test-get-profile@test.com";

async function cleanupTestData() {
  await db.delete(profile).where(eq(profile.userId, TEST_USER_ID));
  await db.delete(user).where(eq(user.id, TEST_USER_ID));
}

describe("getUserProfile", () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  it("ユーザーIDに対応するプロフィールを返す", async () => {
    await db.insert(user).values({
      id: TEST_USER_ID,
      name: "テスト",
      email: TEST_EMAIL,
      emailVerified: false,
    });
    await db.insert(profile).values({
      id: "test-profile-get-1",
      userId: TEST_USER_ID,
      name: "山田太郎",
      gender: "male",
      birthDate: "1990-01-15",
      note: "テスト",
      bloodType: "A",
    });

    const result = await getUserProfile(TEST_USER_ID);

    expect(result).toEqual({
      name: "山田太郎",
      gender: "male",
      birthDate: "1990-01-15",
      note: "テスト",
      bloodType: "A",
      avatarUrl: null,
      oauthImageUrl: null,
    });
  });

  it("avatar_url と user.image を返す", async () => {
    await db.insert(user).values({
      id: TEST_USER_ID,
      name: "テスト",
      email: TEST_EMAIL,
      emailVerified: false,
      image: "https://avatars.example.com/oauth.png",
    });
    await db.insert(profile).values({
      id: "test-profile-get-2",
      userId: TEST_USER_ID,
      name: "山田太郎",
      gender: "male",
      birthDate: "1990-01-15",
      avatarUrl: "https://ex.test/storage/v1/object/public/bkt/u/a.png",
    });

    const result = await getUserProfile(TEST_USER_ID);

    expect(result).toEqual({
      name: "山田太郎",
      gender: "male",
      birthDate: "1990-01-15",
      note: null,
      bloodType: null,
      avatarUrl: "https://ex.test/storage/v1/object/public/bkt/u/a.png",
      oauthImageUrl: "https://avatars.example.com/oauth.png",
    });
  });

  it("存在しないユーザーIDの場合 null を返す", async () => {
    const result = await getUserProfile("non-existent-user");

    expect(result).toBeNull();
  });
});
