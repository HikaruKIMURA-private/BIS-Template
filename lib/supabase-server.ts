import { createClient } from "@supabase/supabase-js";

/**
 * サーバー専用。サービスロールキーはクライアントに出さない。
 */
export function createSupabaseAdmin() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase の環境変数が不足しています（NEXT_PUBLIC_SUPABASE_URL または SUPABASE_URL、SUPABASE_SERVICE_ROLE_KEY）。"
    );
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
