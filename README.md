# BIS-Template

部署プロジェクト用 Next.js テンプレート

## 技術スタック

| カテゴリ               | 技術                                        |
| ---------------------- | ------------------------------------------- |
| フレームワーク         | Next.js 16 (App Router)                     |
| 言語                   | TypeScript                                  |
| スタイリング           | Tailwind CSS v4                             |
| UI コンポーネント      | Radix UI, shadcn/ui                         |
| フォーム               | Conform + Zod                               |
| 認証                   | Better Auth                                 |
| データベース           | PostgreSQL (Supabase)                       |
| ORM                    | Drizzle ORM                                 |
| テスト                 | Vitest (Unit/Integration), Playwright (E2E) |
| コンポーネントカタログ | Storybook                                   |
| Lint/Format            | oxlint, oxfmt                               |
| CI/CD                  | GitHub Actions, Chromatic                   |
| ホスティング(インフラ) | vercel                                      |
| 仕様書駆動ツール       | cc-sdd                                      |

## 必要なツール

- **Docker**: Supabase ローカル環境に必要
- **mise**: ランタイムバージョン管理
- **VS Code**: 推奨エディタ（拡張機能設定済み）

## セットアップ

### 0. safe-chainのインストール

セキュリテイ対策として、safe-chain をインストールしてください

```bash
# macOS
curl -fsSL https://github.com/AikidoSec/safe-chain/releases/latest/download/install-safe-chain.sh | sh

# https://github.com/AikidoSec/safe-chain
```

### 1. Docker のインストール

[Docker Desktop](https://www.docker.com/products/docker-desktop/) をインストールしてください。

### 2. mise のインストール

```bash
# macOS (Homebrew)
brew install mise

# その他の方法
# https://mise.jdx.dev/getting-started.html
```

シェルに mise を有効化：

```bash
# zsh の場合
echo 'eval "$(mise activate zsh)"' >> ~/.zshrc
source ~/.zshrc
```

### 3. プロジェクトのセットアップ

```bash
# リポジトリをフォーク & クローン
# 1. GitHub 上で "Fork" ボタンをクリック
# 2. フォークしたリポジトリをクローン
git clone <your-fork-url>
cd BIS-Template

# mise でツールをインストール（Node.js, pnpm）
mise install

# 依存関係をインストール
pnpm install
```

### 4. 環境変数の設定

```bash
# .env.example をコピーして .env.local を作成
cp .env.example .env.local
```

`.env.local` を編集し、必要な値を設定してください。

#### Vercel / Supabase 本番でのビルド（`drizzle-kit migrate`）

`pnpm build` は先にマイグレーションを実行します。Supabase の **Transaction pooler**（例: ポート `6543`）経由だと `CREATE SCHEMA` などの DDL が失敗することがあります。

1. **Vercel の Environment Variables** に、Supabase の **Direct connection**（通常ポート **5432**）の接続文字列を `DATABASE_URL_MIGRATE` として追加する。
2. アプリのクエリ用には従来どおり **`DATABASE_URL`** に **Pooler**（`6543` など）を設定してよい（サーバーレス向け）。

ローカルでは `DATABASE_URL` だけで足りる（`DATABASE_URL_MIGRATE` は不要）。

### 5. データベースのセットアップ

```bash
# Supabase をローカルで起動（Docker が必要）
pnpm db:start

# マイグレーションを実行
pnpm db:migrate
```

### 6. 開発サーバーの起動

```bash
pnpm dev
```

[http://localhost:3000](http://localhost:3000) でアプリケーションを確認できます。

## 推奨拡張機能（VS Code）

プロジェクトを開くと、推奨拡張機能のインストールを促すポップアップが表示されます。

| 拡張機能        | 用途                       |
| --------------- | -------------------------- |
| oxc             | lint, format               |
| Playwright Test | E2E テストの実行・デバッグ |

### エディタでの設定

## 利用可能なコマンド

### 開発・ビルド

| コマンド         | 説明                 |
| ---------------- | -------------------- |
| `pnpm dev`       | 開発サーバー起動     |
| `pnpm build`     | プロダクションビルド |
| `pnpm storybook` | Storybook 起動       |

### データベース

| コマンド           | 説明                         |
| ------------------ | ---------------------------- |
| `pnpm db:start`    | Supabase ローカル起動        |
| `pnpm db:generate` | マイグレーションファイル生成 |
| `pnpm db:migrate`  | マイグレーション実行         |

### テスト・品質

| コマンド                          | 説明                                     | 前提条件                       |
| --------------------------------- | ---------------------------------------- | ------------------------------ |
| `pnpm typecheck`                  | TypeScript 型チェック                    |                                |
| `pnpm lint`                       | lint                                     |                                |
| `pnpm fmt`                        | format                                   |                                |
| `pnpm test`                       | Unit + Integration テスト実行            | `pnpm db:start`                |
| `pnpm test --project=unit`        | Unit テストのみ実行（DB 不要）           |                                |
| `pnpm test --project=integration` | Integration テストのみ実行（実 DB 接続） | `pnpm db:start`                |
| `pnpm e2e`                        | E2E テスト実行                           | `pnpm db:start` + `pnpm build` |

> **Integration テストの注意**: `pnpm test` は Supabase ローカル DB（Docker）への接続が必要です。
> テスト用 DB (`postgres_test`) は `vitest.global-setup.ts` により自動作成・マイグレーションされるため、手動操作は不要です。
> DB 不要の Unit テストだけを実行したい場合は `pnpm test --project=unit` を使ってください。

## 品質管理

### PR 前チェックリスト

Pull Request を作成する前に、以下のコマンドを実行してください：

```bash
# 型チェック
pnpm typecheck

# Lint/Format
pnpm lint
pnpm fmt

# Unit + Integration テスト（Supabase 起動が必要）
pnpm test
```

### CI で自動検証される項目

- TypeScript 型チェック
- Lint / Format
- Unit テスト（Vitest, jsdom）
- Integration テスト（Vitest, 実 DB 接続）
- E2E テスト（Playwright）
- Chromatic（Visual Regression テスト）

## 仕様駆動開発（cc-sdd）

このプロジェクトでは [cc-sdd](https://github.com/gotalab/cc-sdd) を使った仕様駆動開発（Spec-Driven Development）を採用しています。

### 開発フロー

```
1. Steering（初回のみ）
   ↓
2. 要件定義（requirements.md）
   ↓  ← 承認ゲート
3. 設計（design.md）
   ↓  ← 承認ゲート
4. タスク計画（tasks.md）
   ↓  ← 承認ゲート
5. 実装・検証
```

### コマンド一覧

#### Phase 0: Steering（初回のみ）

プロジェクトの技術スタック・規約を AI に記憶させます。

```bash
/kiro:steering
```

生成されるファイル（`.kiro/steering/`）：

- `product.md`: プロダクトの目的、価値、主要機能
- `tech.md`: 技術スタック、フレームワーク、設計方針
- `structure.md`: プロジェクト構成、命名規則

#### Phase 1: 仕様策定

**1. ワークスペース作成**

```bash
/kiro:spec-init "ユーザープロフィール編集機能"
```

`.kiro/specs/<feature-name>/` フォルダが作成されます。

**2. 要件定義**

```bash
/kiro:spec-requirements <feature-name>
```

自然言語で伝えた要件を EARS 形式（WHEN/THEN/IF）で構造化します。

**3. 設計**

```bash
/kiro:spec-design <feature-name> -y
```

アーキテクチャ決定、システムフロー図を生成します。
`-y` は前フェーズを承認しつつ実行するオプションです。

**4. タスク計画**

```bash
/kiro:spec-tasks <feature-name> -y
```

実装タスクを分解し、各タスクに要件番号を紐づけます。

#### Phase 2: 実装

**タスクを実装**

```bash
# 単一タスク
/kiro:spec-impl <feature-name> 1 -y

# 複数タスク
/kiro:spec-impl <feature-name> 1 2 3 -y
```

**実装の検証**

```bash
/kiro:validate-impl <feature-name>
```

未完了タスクや要件との不一致を検出します。

#### 進捗確認

```bash
/kiro:spec-status <feature-name>
```

参考: [cc-sdd の仕様駆動開発プロセス解説](https://zenn.dev/tmasuyama1114/articles/cc_sdd_whole_flow)
