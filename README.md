# BIS-Template

部署プロジェクト用 Next.js テンプレート

## 技術スタック

| カテゴリ               | 技術                                             |
| ---------------------- | ------------------------------------------------ |
| フレームワーク         | Next.js 16 (App Router)                          |
| 言語                   | TypeScript                                       |
| スタイリング           | Tailwind CSS v4                                  |
| UI コンポーネント      | Radix UI, shadcn/ui                              |
| フォーム               | Conform + Zod                                    |
| 認証                   | Better Auth                                      |
| データベース           | PostgreSQL (Supabase)                            |
| ORM                    | Drizzle ORM                                      |
| テスト                 | Vitest (Unit), storybook(結合), Playwright (E2E) |
| コンポーネントカタログ | Storybook                                        |
| Lint/Format            | Biome                                            |
| CI/CD                  | GitHub Actions, Chromatic                        |
| 仕様書駆動ツール       | cc-sdd                                           |

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

[Docker Desktop](https://www.docker.com/products/docker-desktop/) または [OrbStack](https://orbstack.dev/)（macOS 推奨）をインストールしてください。

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
# リポジトリをクローン
git clone <repository-url>
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
GitHub OAuth の開発用クレデンシャルは別途共有します。

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

| 拡張機能                  | 用途                       |
| ------------------------- | -------------------------- |
| Biome                     | Lint/Format ツール         |
| Playwright Test           | E2E テストの実行・デバッグ |
| Tailwind CSS IntelliSense | クラス名の補完             |
| Auto Rename Tag           | JSX タグの自動リネーム     |
| Path Intellisense         | import パスの補完          |

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

| コマンド         | 説明                    |
| ---------------- | ----------------------- |
| `pnpm typecheck` | TypeScript 型チェック   |
| `pnpm biome`     | Biome で Lint/Format    |
| `pnpm test`      | Unit テスト実行         |
| `pnpm e2e`       | E2E テスト実行          |

## 品質管理

### PR 前チェックリスト

Pull Request を作成する前に、以下のコマンドを実行してください：

```bash
# 型チェック
pnpm typecheck

# Lint/Format
pnpm biome

# Unit テスト
pnpm test
```

### CI で自動検証される項目

- TypeScript 型チェック
- Biome（Lint/Format）
- Unit テスト（Vitest）
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
