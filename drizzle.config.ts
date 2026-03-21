import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });
config();

/** drizzle-kit migrate は DDL を実行する。Supabase の Transaction pooler（例: :6543）では失敗しやすいため、未設定時は DATABASE_URL を使う */
const migrateUrl =
  process.env.DATABASE_URL_MIGRATE ?? process.env.DATABASE_URL!;

export default defineConfig({
  out: "./drizzle",
  schema: "./db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: migrateUrl,
  },
});
