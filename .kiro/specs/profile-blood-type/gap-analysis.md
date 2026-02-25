# ギャップ分析レポート: profile-blood-type

## 概要

本レポートは、`profile-blood-type` 仕様の要件と既存コードベースの差分を分析した結果をまとめたものである。

---

## 分析対象ファイル

| レイヤー | ファイルパス | 現状 |
|---|---|---|
| DB スキーマ | `db/schema.ts` | `profile` テーブルに `bloodType` カラムなし |
| マイグレーション | `drizzle/0002_keen_kulan_gath.sql` | 血液型カラムなし |
| Zod スキーマ | `app/schema.ts` | `bloodType` フィールドなし |
| Server Action | `app/actions/profile.ts` | 血液型の処理なし |
| データ取得 | `app/data/profile.ts` | 血液型の取得なし |
| 表示コンポーネント | `app/components/ProfileCard.tsx` | 血液型の表示なし |
| フォームコンポーネント | `app/components/UserForm.tsx` | 血液型入力フィールドなし |
| テスト | `app/components/UserForm.test.tsx` | 血液型のテストなし |
| モック | `app/actions/__mocks__/profile.ts` | 血液型未考慮 |

---

## 要件別ギャップ詳細

### 要件 1: 血液型フィールドの追加

| AC# | 受入条件 | ギャップ状態 | 影響ファイル |
|---|---|---|---|
| 1.1 | 血液型の選択肢として「A型」「B型」「O型」「AB型」を表示する | **未実装** | `app/components/UserForm.tsx` |
| 1.2 | 血液型を任意項目（未選択可）として扱う | **未実装** | `app/schema.ts`, `app/components/UserForm.tsx` |
| 1.3 | 選択された血液型をデータベースに永続化する | **未実装** | `app/actions/profile.ts`, `db/schema.ts` |
| 1.4 | 血液型を未選択のまま保存した場合、null として保存する | **未実装** | `app/actions/profile.ts`, `db/schema.ts` |
| 1.5 | 既存の血液型を別の値に変更して保存した場合、新しい血液型でDBを更新する | **未実装** | `app/actions/profile.ts` |

### 要件 2: 血液型の表示

| AC# | 受入条件 | ギャップ状態 | 影響ファイル |
|---|---|---|---|
| 2.1 | 血液型が登録されている場合、プロフィール表示画面に血液型のラベルと値を表示する | **未実装** | `app/components/ProfileCard.tsx` |
| 2.2 | 血液型が未登録（null）の場合、非表示もしくは「未設定」と表示する | **未実装** | `app/components/ProfileCard.tsx` |
| 2.3 | 血液型を「A型」「B型」「O型」「AB型」の日本語ラベルで表示する | **未実装** | `app/components/ProfileCard.tsx` |

### 要件 3: バリデーション

| AC# | 受入条件 | ギャップ状態 | 影響ファイル |
|---|---|---|---|
| 3.1 | 許可された値（A, B, O, AB）以外の血液型が送信された場合、バリデーションエラーを返す | **未実装** | `app/schema.ts` |
| 3.2 | クライアント・サーバーで同一の Zod スキーマによりバリデーションを実施する | **部分実装** — 既存スキーマ共有パターンは確立済み（`app/schema.ts` を双方から利用）。血液型フィールドの追加のみ必要 | `app/schema.ts` |
| 3.3 | 血液型のバリデーションエラーが発生した場合、フォーム上にエラーメッセージを表示する | **未実装** | `app/components/UserForm.tsx` |

### 要件 4: データベーススキーマの拡張

| AC# | 受入条件 | ギャップ状態 | 影響ファイル |
|---|---|---|---|
| 4.1 | profile テーブルに血液型を格納する text 型のカラムを持つ | **未実装** — 現在の `profile` テーブルには `id`, `userId`, `name`, `gender`, `birthDate`, `note`, `createdAt`, `updatedAt` のみ | `db/schema.ts` |
| 4.2 | blood type カラムは nullable であり、既存データに影響を与えない | **未実装** | `db/schema.ts`, 新規マイグレーション |
| 4.3 | マイグレーション実行時、既存レコードの血液型を null として保持する | **未実装** — nullable カラムの `ALTER TABLE ADD COLUMN` で自動的に達成可能 | 新規マイグレーション |

### 要件 5: 編集フォームとの統合

| AC# | 受入条件 | ギャップ状態 | 影響ファイル |
|---|---|---|---|
| 5.1 | 既存のフォームフィールドと同一のフォーム内に血液型フィールドを配置する | **未実装** | `app/components/UserForm.tsx` |
| 5.2 | 編集モード切替時、現在登録されている血液型を初期値として表示する | **未実装** | `app/components/UserForm.tsx` |
| 5.3 | 血液型が未登録の場合、フィールドを未選択状態で表示する | **未実装** | `app/components/UserForm.tsx` |
| 5.4 | ラジオボタンまたはセレクトボックスによる選択式 UI を採用する | **未実装** | `app/components/UserForm.tsx` |

---

## 既存アーキテクチャとの整合性

### 再利用可能なパターン（変更不要）

| パターン | 説明 |
|---|---|
| Zod スキーマ共有 | `app/schema.ts` をサーバー・クライアント双方からインポートする設計は確立済み。血液型フィールドを追加するだけでよい |
| Conform + useActionState | `UserForm.tsx` で Conform + `useActionState` パターンが実装済み。新フィールド追加は既存パターンに従えばよい |
| Server Action パターン | `app/actions/profile.ts` の upsert パターンが確立済み。`set` オブジェクトと `values` オブジェクトに `bloodType` を追加するだけ |
| データ取得パターン | `app/data/profile.ts` の select パターンが確立済み。select フィールドに `bloodType` を追加するだけ |
| ProfileCard 表示パターン | `ProfileCard.tsx` の `<dl>/<dt>/<dd>` パターンが確立済み。血液型の表示項目を追加するだけ |

### 変更が必要なファイル一覧

| ファイル | 変更種別 | 変更内容 |
|---|---|---|
| `db/schema.ts` | **修正** | `profile` テーブルに `bloodType: text("blood_type")` カラムを追加 |
| `drizzle/` | **新規** | `ALTER TABLE profile ADD COLUMN blood_type text;` マイグレーション生成 |
| `app/schema.ts` | **修正** | `profileFormSchema` に `bloodType` フィールド追加（`z.enum(["A", "B", "O", "AB"]).optional()`）、`ProfileData` 型に `bloodType` 追加 |
| `app/actions/profile.ts` | **修正** | `submission.value` から `bloodType` を取得し、insert/update の対象に含める |
| `app/data/profile.ts` | **修正** | `select` に `bloodType: profile.bloodType` を追加 |
| `app/components/UserForm.tsx` | **修正** | 血液型フィールド（ラジオボタンまたはセレクトボックス）を追加 |
| `app/components/ProfileCard.tsx` | **修正** | 血液型の表示ロジック（日本語ラベルマッピング + null 時の処理）を追加 |
| `app/components/UserForm.test.tsx` | **修正** | 血液型フィールドのレンダリング・入力テストを追加 |
| `app/actions/__mocks__/profile.ts` | **修正** | モックの戻り値に `bloodType` を含める（必要に応じて） |

---

## リスク・注意事項

| 項目 | 詳細 |
|---|---|
| 後方互換性 | `blood_type` カラムは nullable で追加するため、既存データへの影響なし。マイグレーション実行のみで対応可能 |
| スキーマ同期 | Drizzle ORM のスキーマ定義とマイグレーションの整合性を確認すること。`pnpm drizzle-kit generate` で自動生成推奨 |
| 型安全性 | `ProfileData` 型と `ProfileFormData` 型の両方に `bloodType` を反映する必要あり |
| UI 一貫性 | 既存の性別フィールド（ラジオボタン）と同様のパターンで血液型フィールドを実装すれば一貫性を保てる |

---

## 結論

血液型機能は **完全に未実装** であり、DB からフロントエンドまで全レイヤーにわたる変更が必要である。ただし、既存のプロフィール機能が確立したパターン（Zod スキーマ共有、Conform フォーム、Server Action upsert、Drizzle select）に沿って構築されているため、各レイヤーへのフィールド追加は**既存パターンの拡張**で対応可能であり、アーキテクチャ上の大きな変更は不要である。
