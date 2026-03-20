# ギャップ分析レポート: profile-image

## 概要

本レポートは、`profile-image` 仕様の要件と既存コードベースの差分を分析したものである。プロフィールのテキスト属性は `profile` テーブルと `UserForm` / `ProfileCard` で既に実装されている一方、**画像のアップロード・検証・表示・削除の一式は未実装**である。Better Auth 用の `user` テーブルには **`image`（URL 用 text）カラムが既に存在**するが、ダッシュボードのプロフィール UI では参照されていない。

**メモ**: `spec.json` 上は要件フェーズ未承認（`approvals.requirements.approved: false`）だが、設計判断の材料として本分析は有効である。

---

## 分析対象ファイル

| レイヤー | ファイルパス | 現状 |
|---|---|---|
| DB — `user` | `db/schema.ts` | `user.image`（nullable text）あり。OAuth 等で外部 URL が入る想定のスキーマ |
| DB — `profile` | `db/schema.ts` | プロフィール画像用カラムなし |
| Zod / 型 | `app/schema.ts` | ファイル入力・画像 URL 用フィールドなし |
| Server Action | `app/actions/profile.ts` | テキスト属性の upsert のみ。ファイル処理・ストレージ書き込みなし |
| データ取得 | `app/data/profile.ts` | `profile` のみ select。`user.image` も未取得 |
| フォーム UI | `app/components/UserForm.tsx` | `<input type="file">`、プレビュー、multipart 対応なし |
| 表示 UI | `app/components/ProfileCard.tsx` | アバター／画像表示・プレースホルダーなし |
| ダッシュボード | `app/(protected)/dashboard/page.tsx` | `getUserProfile` + `ProfileCard` / `UserForm` のみ |
| プロキシ型 | `proxy.ts` | セッション型に `user.image?` はあるが UI 未使用 |
| Storybook モック | `app/actions/__mocks__/profile.ts` | 画像用アクションなし |
| テスト | `app/data/profile.test.ts`, `app/components/UserForm.test.tsx` | 画像関連テストなし |
| 依存関係 | `package.json` | 専用のオブジェクトストレージ SDK は未導入（設計で選定） |

---

## 要件から導く技術ニーズとギャップ

| ニーズ分類 | 内容 | ギャップ |
|---|---|---|
| データモデル | 画像の所在（URL またはキー）を永続化 | **Missing** — `profile` 拡張または `user.image` 活用の決定が必要 |
| サーバー処理 | 認証検証、本人のみ更新、multipart 受信、形式・サイズ検証、ストレージ保存、旧ファイルの扱い | **Missing** |
| クライアント | 選択・プレビュー・制約説明・エラー表示・削除 UI | **Missing** |
| 表示 | `next/image` 等での表示、未設定プレースホルダー、読み込み失敗時のフォールバック | **Missing** |
| 非機能 | ファイルサイズ上限、許可 MIME、レート制限、ストレージ ACL | **Unknown / Research** — 設計・インフラ選定で確定 |

---

## 要件別ギャップ（要約マッピング）

| 要件 | 受入の焦点 | ギャップ状態 |
|---|---|---|
| Req 1 登録・更新 | 本人のみ、認証必須、差し替え | **未実装** — Server Action と保存先の設計が必要 |
| Req 2 表示 | 設定済み／未設定／取得失敗 | **未実装** — `ProfileCard`（および必要ならレイアウト）に表示経路がない |
| Req 3 検証 | 形式・サイズ・破損、事前説明 | **未実装** — Zod（`z.instanceof(File)` 等）とサーバー側の二重確認パターンを新設 |
| Req 4 削除 | クリアで未設定へ | **未実装** — DB/ストレージ上の「関連付け解除」と UI 導線が必要 |
| Req 5 体験 | 他属性更新で画像を消さない、フィードバック、編集 UI 一貫性 | **Constraint** — 現行 `upsertProfile` は `set(record)` で渡したカラムのみ更新するため、`profile` に画像カラムを追加しフォームに含めない場合は **Drizzle の挙動次第で他カラムは維持されやすい**。`user.image` 単独運用時は「プロフィール保存」と「画像更新」の責務分離を設計で明確化する必要あり |

---

## 実装アプローチの選択肢（最終決定は設計フェーズ）

### Option A: `profile` テーブルに画像 URL（またはストレージキー）を追加する

- **内容**: `profile` に `avatarUrl` 等を追加し、既存の `getUserProfile` / `ProfileData` / `UserForm` 流れに載せる。アップロードは別 Server Action または同一フォーム multipart。
- **向き**: アプリの「プロフィール」ドメインを `profile` テーブルに集約している現状と整合しやすい。
- **トレードオフ**: ✅ 表示データが `getUserProfile` で一括取得しやすい / ❌ `user.image`（OAuth アバター）との二重管理や優先順位のルールが必要な場合あり。

### Option B: 既存の `user.image` のみを更新・表示する

- **内容**: Better Auth / Drizzle で `user` 行の `image` を更新し、セッションまたは DB から URL を読み `ProfileCard` に表示。
- **向き**: スキーマ追加が最小。GitHub OAuth 利用者のプロバイダ画像と同一フィールドで扱える。
- **トレードオフ**: ✅ DB マイグレーションが不要な場合あり / ❌ `app/data/profile.ts` が `profile` のみなので、**取得経路の追加**（`user` join または別関数）が必要。プロフィール未作成ユーザーとの表示整合も設計が必要。

### Option C: ハイブリッド（例: `user.image` をデフォルト、`profile` で上書き）

- **内容**: 表示時に `profile` の値があれば優先、なければ `user.image`。
- **向き**: OAuth 画像と手動アップロードの共存を柔軟にしたい場合。
- **トレードオフ**: ✅ 利用者体験は豊かになり得る / ❌ 削除・差し替え・「プロバイダに戻す」のルールが複雑。

---

## 工数・リスク（目安）

| 項目 | 評価 | 根拠（1 行） |
|---|---|---|
| 工数 | **M〜L** | ファイル受信・バリデーション・ストレージ連携・UI・テストが一括で新規。既存 Conform フォームへの載せ方も検討が必要 |
| リスク | **中** | 外部ストレージまたは自前配信の選定、multipart と Server Actions の境界、旧ファイルの GC 方針が未確定 |

---

## 設計フェーズに引き渡す調査項目（Research Needed）

1. **オブジェクトストレージ**: Supabase Storage（既に Supabase を DB に利用）と Vercel Blob、S3 互換等の比較（コスト、署名付き URL、Next.js からの書き込み経路）。
2. **Better Auth**: `user.image` をアプリから更新する公式・推奨手段（`auth.api.updateUser` 等の有無と制約）。
3. **画像処理**: リサイズ・サムネイルをサーバーで行うか、クライアントのみか、要件レベルでの必須有無。
4. **Conform + ファイル**: 同一フォームにテキストとファイルを載せる場合の `parseWithZod` / `FormData` のパターン（プロジェクト内に先行例なし）。

---

## 推奨する設計フェーズでの着手法（あくまで提案）

- **データ所在**を Option A / B / C のいずれにするか早めに決め、`getUserProfile` と `ProfileCard` のデータ契約（`ProfileData`）を一貫させる。
- **アップロード**は責務が重いため、初期実装では「専用 Server Action + 小さめのクライアントコンポーネント」（Option B のニュアンスに近い分割）と **既存 `UserForm` への段階的統合**（ハイブリッド実装）も現実的である。

---

## 結論

プロフィール画像機能は **表示・永続化・アップロードパイプラインのいずれも未実装** であり、ブラウンフィールドとしてはギャップが大きい。一方で、**認証済み本人のみ更新**する既存パターン（`submitProfileForm` のセッション検証）、**Zod 共有**、`app/actions` / `app/data` / `app/components` の分割は流用可能であり、不足は主に **ファイル・ストレージ領域**である。設計では **画像の正（`profile` vs `user.image`）** と **ストレージ** を決めることが最優先の分岐になる。
