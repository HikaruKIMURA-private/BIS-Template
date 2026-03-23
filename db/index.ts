import { drizzle } from "drizzle-orm/postgres-js";

export const db = drizzle(process.env.DATABASE_URL!);

/** トランザクション内クライアント（`db` と同一API） */
export type DbTransaction = Parameters<
  Parameters<typeof db.transaction>[0]
>[0];

export type DbExecutor = typeof db | DbTransaction;
