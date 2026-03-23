import { execSync } from "node:child_process";

function getSupabaseDbContainer(): string {
  const output = execSync(
    'docker ps --format "{{.Names}}" --filter "name=supabase_db_"',
    { encoding: "utf-8" }
  ).trim();

  const container = output.split("\n")[0];
  if (!container) {
    throw new Error(
      "Supabase DB container not found. Run `pnpm db:start` first."
    );
  }
  return container;
}

export async function setup() {
  const container = getSupabaseDbContainer();

  // ローカルに残った別ブランチ由来のマイグレーション履歴と混ざらないよう、テスト専用 DB を毎回作り直す
  execSync(
    `docker exec ${container} psql -U postgres -c "DROP DATABASE IF EXISTS postgres_test WITH (FORCE);"`,
    { stdio: "pipe" }
  );
  execSync(
    `docker exec ${container} psql -U postgres -c "CREATE DATABASE postgres_test;"`,
    { stdio: "pipe" }
  );

  execSync("pnpm db:migrate", {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL:
        "postgresql://postgres:postgres@127.0.0.1:54322/postgres_test",
    },
  });
}
