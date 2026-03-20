# Research & Design Decisions: profile-image

---

## Summary

- **Feature**: `profile-image`
- **Discovery Scope**: Extension（既存プロフィール機能の拡張）＋ Complex Integration（オブジェクトストレージ）
- **Key Findings**:
  - 既存スタックは PostgreSQL on Supabase のため、**同一プロジェクトの Supabase Storage** を第一候補とすると運用・認証情報の集約に有利。
  - Better Auth はクライアント `updateUser({ image: url })` で `user.image` を更新可能だが、本設計では **アプリのプロフィールドメインを `profile` テーブルに集約**し、OAuth 由来の `user.image` は表示フォールバックに限定する方針とした。
  - Conform でテキストプロフィールとファイルを **単一 FormData に統合**すると、既存 `submitProfileForm` の redirect 挙動やバリデーション境界が複雑化するため、**画像は専用 Server Action ＋ UserForm 内クライアントブロック**とする案がリスク低。

## Research Log

### Supabase Storage と Next.js Server Action

- **Context**: サーバー側でアップロードし、公開 URL を DB に保存するパターンの妥当性確認。
- **Sources Consulted**: [Supabase JS Client リファレンス](https://supabase.com/docs/reference/javascript/storage-from-upload)（`@supabase/supabase-js` の Storage API）、プロジェクト `tech.md`（DB に Supabase 利用の記載）。
- **Findings**:
  - `storage.from(bucket).upload(path, body, options)` によりサーバーからアップロード可能。
  - 書き込みには **service role** 等、クライアントに漏らさない鍵が必要。バケット RLS／ポリシーはプロジェクトで個別設定。
- **Implications**: サーバー専用モジュールで Supabase クライアントを生成し、環境変数で URL と service role を渡す設計とする。`next/image` 利用時は `next.config` の remotePatterns に Supabase 公開 URL のホストを追加する必要あり。

### Better Auth の `user.image`

- **Context**: ギャップ分析 Option B（`user.image` のみ）との比較。
- **Sources Consulted**: [Better Auth Users 概念ドキュメント](https://www.better-auth.com/docs/concepts/users)、コミュニティ上の `updateUser` / アバター関連議論。
- **Findings**:
  - クライアントから `authClient.updateUser({ image: "https://..." })` 等で画像 URL を保存する流れが想定される。
  - ストレージアップロードは別 API で行い、URL のみを Auth に渡す構成が一般的。
- **Implications**: **プロフィール画像の正**を `profile.avatar_url` に置く場合、Auth の `image` と二重管理になり得る。設計では **永続化の正は profile**、**表示は `profile.avatar_url` が無いときのみ `user.image` をフォールバック**とし、削除は profile のみクリア（OAuth 画像は残り得る）と明示する。

### Conform とファイル入力

- **Context**: 既存 `UserForm` は `parseWithZod` ＋ テキストフィールド中心。
- **Sources Consulted**: プロジェクト内先行例なし。一般的な Server Actions multipart の挙動。
- **Findings**:
  - 単一フォームにファイルとテキストを混在させると、`redirect` タイミングや `useActionState` の結果型共有が複雑化しやすい。
  - 画像ブロックを **別 action** に分離し、成功時は `revalidatePath` のみ共有する方が境界が明確。
- **Implications**: 要件 5.3 の「矛盾しない導線」は **同一画面内配置**で満たし、送信は画像用・テキスト用で action を分けるハイブリッドを採用。

## Architecture Pattern Evaluation

| Option | 説明 | 利点 | リスク・制約 |
| ------ | ---- | ---- | ------------ |
| A profile のみ | `profile.avatar_url` のみ表示 | `getUserProfile` と一貫、実装単純 | OAuth 利用者はアップロードまでプレースホルダーのまま |
| B user.image のみ | Better Auth の image のみ更新 | マイグレーション最小 | プロフィール未作成ユーザーとの整合、`getUserProfile` 外のデータ取得が必要 |
| C ハイブリッド表示 | 保存は profile、表示は profile 優先し user.image をフォールバック | UX とドメイン境界のバランス | 削除後も OAuth 画像が残る場合の説明責任 |

**採用**: データ永続化は **profile.avatar_url**、表示は **Option C**。

## Design Decisions

### Decision: ストレージに Supabase Storage を採用する

- **Context**: バイナリの永続化先が未決だった。
- **Alternatives Considered**:
  1. Vercel Blob — ホスティング連携が強いが別サービス追加。
  2. DB BYTEA — 運用・サイズ・パフォーマンスの観点で不採用。
- **Selected Approach**: Supabase Storage にオブジェクトを保存し、公開可能な URL（または署名付き URL 方針を環境で選択）を `profile.avatar_url` に保存。
- **Rationale**: 既に Supabase を DB に利用しており、同一プロジェクトでバケットとポリシーを管理しやすい。
- **Trade-offs**: ローカル開発で Storage エミュレーション／バケット作成が必要。`@supabase/supabase-js` の依存追加。
- **Follow-up**: バケット名・ポリシー・公開範囲は実装タスクでリポジトリ README または env 例に明記。

### Decision: 画像更新を専用 Server Action に分離する

- **Context**: 要件 5 と既存 `submitProfileForm` の単純さを両立する。
- **Alternatives Considered**:
  1. `submitProfileForm` に multipart を統合。
  2. Route Handler POST のみでアップロード。
- **Selected Approach**: `setProfileAvatar` / `clearProfileAvatar`（名称は実装で確定）を `app/actions/` に置き、`UserForm` 内にクライアントサブツリーから呼び出す。
- **Rationale**: テキスト upsert とファイル I/O の失敗モード・トランザクション境界が異なるため分離が保守しやすい。
- **Trade-offs**: action ファイルが増える。成功後の UI 更新は revalidate に依存。

## Risks & Mitigations

- **サービスロールキー漏洩** — サーバーモジュールに閉じ、クライアントバンドルに含めない。env テンプレートで警告。
- **バケットの公開範囲誤設定** — 設計では書き込みはサーバーのみ、読み取りは公開 URL 前提で next/image 用にホスト許可。必要に応じて非公開バケット＋署名 URL へ変更可能と research に残す。
- **大ファイル・不正ファイル** — MIME と最大バイトの二重チェック、ストレージ側の最大サイズ設定を推奨。

## References

- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction) — Storage 操作
- [Better Auth — Users](https://www.better-auth.com/docs/concepts/users) — `user.image` の意味付け
- プロジェクト `.kiro/specs/profile-image/gap-analysis.md` — 既存コードギャップ
