# 設計ドキュメント: profile-blood-type

## 概要

既存のプロフィール管理機能に「血液型」フィールドを追加する。DB スキーマからフロントエンドまで、全レイヤーにわたって既存パターンを拡張する形で実装する。アーキテクチャ上の新規パターン導入は不要。

---

## 1. データベース設計

### 1.1 スキーマ変更 (`db/schema.ts`)

`profile` テーブルに `bloodType` カラムを追加する。

```typescript
bloodType: text("blood_type"), // nullable — "A" | "B" | "O" | "AB" | null
```

- **型**: `text` （Drizzle の `text()` ヘルパー）
- **制約**: nullable（デフォルト null）。既存レコードへの後方互換性を保証する
- **配置**: `note` カラムの後、`createdAt` の前に定義する

### 1.2 マイグレーション

`pnpm drizzle-kit generate` で自動生成する。結果として以下と同等の SQL が出力される想定:

```sql
ALTER TABLE "profile" ADD COLUMN "blood_type" text;
```

- nullable カラムの追加のため、既存レコードには `null` が自動的に設定される
- ダウンタイムなしで適用可能

---

## 2. バリデーション設計

### 2.1 Zod スキーマ (`app/schema.ts`)

`profileFormSchema` に `bloodType` フィールドを追加する。

```typescript
bloodType: z
  .enum(["A", "B", "O", "AB"], {
    message: "血液型を正しく選択してください",
  })
  .optional(),
```

- **任意項目**: `.optional()` により未選択を許容する
- **許可値**: `"A"`, `"B"`, `"O"`, `"AB"` の 4 値のみ
- **共有**: サーバーサイド（Server Action）とクライアントサイド（Conform `onValidate`）で同一スキーマを使用する既存パターンを踏襲

### 2.2 型定義 (`app/schema.ts`)

`ProfileData` 型にも `bloodType` を追加する。

```typescript
export type ProfileData = {
  name: string;
  gender: string;
  birthDate: string;
  note: string | null;
  bloodType: string | null; // 追加
};
```

`ProfileFormData` は `z.infer<typeof profileFormSchema>` から自動推論されるため、手動変更不要。

---

## 3. サーバーサイド設計

### 3.1 Server Action (`app/actions/profile.ts`)

既存の `submitProfileForm` を拡張する。

- `submission.value` から `bloodType` をデストラクチャリングで取得
- `db.update()` の `set` オブジェクトに `bloodType: bloodType ?? null` を追加
- `db.insert()` の `values` オブジェクトに `bloodType: bloodType ?? null` を追加
- 成功レスポンスの `value` に `bloodType` を含める

### 3.2 データ取得 (`app/data/profile.ts`)

`getUserProfile` の `select` に `bloodType: profile.bloodType` を追加する。

---

## 4. フロントエンド設計

### 4.1 フォームコンポーネント (`app/components/UserForm.tsx`)

#### UI 選択: ラジオボタン

性別フィールドと同様のラジオボタン方式を採用する。理由:

- 選択肢が 4 つと少数であり、一覧性が高い
- 既存の性別フィールドと UI パターンを統一できる
- 未選択状態を明示的に扱える（初期状態で何も選択されていない）

#### 選択肢定義

```typescript
const bloodTypeOptions: Array<{ value: string; label: string }> = [
  { value: "A", label: "A型" },
  { value: "B", label: "B型" },
  { value: "O", label: "O型" },
  { value: "AB", label: "AB型" },
];
```

#### フォーム統合

- `useForm` の `defaultValue` に `bloodType: defaultProfile?.bloodType ?? ""` を追加
- Conform の `getInputProps(fields.bloodType, { type: "radio", value: option.value })` でラジオボタンを生成
- 配置: 性別フィールドの直後、生年月日フィールドの前
- エラー表示: 既存フィールドと同一の `<p role="alert">` パターン

### 4.2 表示コンポーネント (`app/components/ProfileCard.tsx`)

#### 日本語ラベルマッピング

```typescript
const bloodTypeLabel: Record<string, string> = {
  A: "A型",
  B: "B型",
  O: "O型",
  AB: "AB型",
};
```

#### 表示ロジック

- `profile.bloodType` が truthy の場合: `<dl>` 内に `<dt>血液型</dt><dd>{ラベル}</dd>` を表示
- `profile.bloodType` が `null` / `undefined` の場合: 血液型の項目を非表示にする（既存の `note` フィールドと同様の条件付きレンダリングパターン）
- 配置: 性別の後、生年月日の前

---

## 5. テスト設計

### 5.1 ユニットテスト (`app/components/UserForm.test.tsx`)

既存テストに以下を追加:

| テストケース | 検証内容 |
|---|---|
| 血液型のラジオボタンが表示される | 「A型」「B型」「O型」「AB型」の 4 つのラジオボタンが存在すること |
| 既存ラジオボタン数の更新 | ラジオボタン総数が 2（性別）から 6（性別 2 + 血液型 4）に増加していること |
| 血液型を選択できる | ラジオボタンクリックで `checked` 状態になること |

### 5.2 モック更新 (`app/actions/__mocks__/profile.ts`)

変更不要。モックは `mockResolvedValue(undefined)` を返しており、`bloodType` の追加による影響なし。ただし、Storybook のストーリーで `ProfileData` を使用している場合は `bloodType` プロパティの追加が必要。

---

## 6. 変更ファイル一覧

| # | ファイル | 変更種別 | 要件マッピング |
|---|---|---|---|
| 1 | `db/schema.ts` | 修正 | 要件 4 (AC 4.1, 4.2) |
| 2 | `drizzle/` 新規マイグレーション | 自動生成 | 要件 4 (AC 4.3) |
| 3 | `app/schema.ts` | 修正 | 要件 1 (AC 1.2), 要件 3 (AC 3.1, 3.2) |
| 4 | `app/actions/profile.ts` | 修正 | 要件 1 (AC 1.3, 1.4, 1.5) |
| 5 | `app/data/profile.ts` | 修正 | 要件 2 (AC 2.1) |
| 6 | `app/components/UserForm.tsx` | 修正 | 要件 1 (AC 1.1, 1.2), 要件 3 (AC 3.3), 要件 5 (AC 5.1–5.4) |
| 7 | `app/components/ProfileCard.tsx` | 修正 | 要件 2 (AC 2.1, 2.2, 2.3) |
| 8 | `app/components/UserForm.test.tsx` | 修正 | テスト |

---

## 7. 要件トレーサビリティ

| 要件 | AC | 設計セクション |
|---|---|---|
| 要件 1: 血液型フィールドの追加 | 1.1 | §4.1 UI 選択肢定義 |
| | 1.2 | §2.1 Zod スキーマ `.optional()` |
| | 1.3 | §3.1 Server Action insert/update |
| | 1.4 | §3.1 `bloodType ?? null` |
| | 1.5 | §3.1 Server Action update |
| 要件 2: 血液型の表示 | 2.1 | §4.2 条件付き表示 |
| | 2.2 | §4.2 null 時非表示 |
| | 2.3 | §4.2 日本語ラベルマッピング |
| 要件 3: バリデーション | 3.1 | §2.1 `z.enum()` |
| | 3.2 | §2.1 スキーマ共有パターン |
| | 3.3 | §4.1 エラー表示パターン |
| 要件 4: DB スキーマ拡張 | 4.1 | §1.1 `text("blood_type")` |
| | 4.2 | §1.1 nullable |
| | 4.3 | §1.2 マイグレーション |
| 要件 5: 編集フォーム統合 | 5.1 | §4.1 配置 |
| | 5.2 | §4.1 `defaultValue` |
| | 5.3 | §4.1 未選択状態 |
| | 5.4 | §4.1 ラジオボタン方式 |
