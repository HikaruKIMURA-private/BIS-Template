# 実装タスク: profile-blood-type

## タスク一覧

### タスク 1: データベーススキーマに bloodType カラムを追加

**ファイル:** `db/schema.ts`
**要件:** 要件 4 (AC 4.1, 4.2)
**依存:** なし

**変更内容:**

- `profile` テーブル定義の `note` カラムの後に `bloodType: text("blood_type")` を追加する
- nullable とする（既存レコードとの後方互換性を保証）

**完了条件:**

- [x] `db/schema.ts` の `profile` テーブルに `bloodType` カラムが追加されている
- [x] カラムは nullable である

---

### タスク 2: マイグレーションファイルの生成

**コマンド:** `pnpm drizzle-kit generate`
**要件:** 要件 4 (AC 4.3)
**依存:** タスク 1

**変更内容:**

- Drizzle Kit でマイグレーションを自動生成する
- `ALTER TABLE "profile" ADD COLUMN "blood_type" text;` と同等の SQL が生成される想定

**完了条件:**

- [x] `drizzle/` ディレクトリに新しいマイグレーションファイルが生成されている
- [x] マイグレーション SQL が `blood_type` text カラムの追加である

---

### タスク 3: Zod スキーマと型定義に bloodType を追加

**ファイル:** `app/schema.ts`
**要件:** 要件 1 (AC 1.2), 要件 3 (AC 3.1, 3.2)
**依存:** なし

**変更内容:**

- `profileFormSchema` に `bloodType` フィールドを追加する:
  ```typescript
  bloodType: z
    .enum(["A", "B", "O", "AB"], {
      message: "血液型を正しく選択してください",
    })
    .optional(),
  ```
- `ProfileData` 型に `bloodType: string | null` を追加する

**完了条件:**

- [x] `profileFormSchema` に `bloodType` フィールドが追加されている（`z.enum().optional()`）
- [x] `ProfileData` 型に `bloodType: string | null` が追加されている

---

### タスク 4: データ取得関数に bloodType を追加

**ファイル:** `app/data/profile.ts`
**要件:** 要件 2 (AC 2.1)
**依存:** タスク 1

**変更内容:**

- `getUserProfile` の `select` オブジェクトに `bloodType: profile.bloodType` を追加する

**完了条件:**

- [x] `getUserProfile` が `bloodType` を含むオブジェクトを返す

---

### タスク 5: Server Action に bloodType の処理を追加

**ファイル:** `app/actions/profile.ts`
**要件:** 要件 1 (AC 1.3, 1.4, 1.5)
**依存:** タスク 1, タスク 3

**変更内容:**

- `submission.value` のデストラクチャリングに `bloodType` を追加する
- `db.update()` の `set` オブジェクトに `bloodType: bloodType ?? null` を追加する
- `db.insert()` の `values` オブジェクトに `bloodType: bloodType ?? null` を追加する
- 成功レスポンスの `value` に `bloodType` を含める

**完了条件:**

- [x] insert 時に `bloodType` が保存される
- [x] update 時に `bloodType` が更新される
- [x] 未選択時は `null` として保存される
- [x] 成功レスポンスに `bloodType` が含まれる

---

### タスク 6: プロフィール表示コンポーネントに血液型を追加

**ファイル:** `app/components/ProfileCard.tsx`
**要件:** 要件 2 (AC 2.1, 2.2, 2.3)
**依存:** タスク 3

**変更内容:**

- `bloodTypeLabel` マッピングオブジェクトを定義する:
  ```typescript
  const bloodTypeLabel: Record<string, string> = {
    A: "A型", B: "B型", O: "O型", AB: "AB型",
  };
  ```
- `<dl>` 内の性別の後、生年月日の前に血液型の表示を追加する
- `profile.bloodType` が truthy の場合のみ表示する（`note` と同様の条件付きレンダリング）

**完了条件:**

- [x] 血液型が登録されている場合、日本語ラベル（「A型」等）で表示される
- [x] 血液型が null の場合、項目が非表示になる
- [x] 性別の後、生年月日の前に配置されている

---

### タスク 7: プロフィール編集フォームに血液型フィールドを追加

**ファイル:** `app/components/UserForm.tsx`
**要件:** 要件 1 (AC 1.1, 1.2), 要件 3 (AC 3.3), 要件 5 (AC 5.1–5.4)
**依存:** タスク 3

**変更内容:**

- `bloodTypeOptions` 配列を定義する:
  ```typescript
  const bloodTypeOptions: Array<{ value: string; label: string }> = [
    { value: "A", label: "A型" },
    { value: "B", label: "B型" },
    { value: "O", label: "O型" },
    { value: "AB", label: "AB型" },
  ];
  ```
- `useForm` の `defaultValue` に `bloodType: defaultProfile?.bloodType ?? ""` を追加する
- 性別フィールドの直後、生年月日フィールドの前に、性別と同じラジオボタンパターンで血液型フィールドを配置する
- エラー表示は既存フィールドと同一の `<p role="alert">` パターンを使用する

**完了条件:**

- [x] 「A型」「B型」「O型」「AB型」の 4 つのラジオボタンが表示される
- [x] 血液型は任意項目として扱われる（未選択で保存可能）
- [x] 編集時に既存の血液型が初期値として選択される
- [x] バリデーションエラー時にエラーメッセージが表示される
- [x] 性別の後、生年月日の前に配置されている

---

### タスク 8: ユニットテストの更新

**ファイル:** `app/components/UserForm.test.tsx`
**要件:** テスト
**依存:** タスク 7

**変更内容:**

- 「血液型のラジオボタンが正しく表示される」テストを追加する
  - 「A型」「B型」「O型」「AB型」の 4 つのラジオボタンが存在すること
- 既存の「性別のラジオボタンが正しく表示される」テストのラジオボタン総数を 2 から 6 に更新する
- 「血液型を選択できる」テストを追加する
  - ラジオボタンクリックで `checked` 状態になること

**完了条件:**

- [x] 血液型のラジオボタン表示テストが追加されている
- [x] ラジオボタン総数の期待値が更新されている
- [x] 血液型の選択テストが追加されている
- [x] 全テストが通過する
