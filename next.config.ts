import type { NextConfig } from "next";

/** getPublicUrl は SUPABASE_URL 由来。next/image は NEXT_PUBLIC_* のみだとホスト不一致で読み込み失敗するため両方を許可する */
function supabaseStorageRemotePatterns(): NonNullable<
  NonNullable<NextConfig["images"]>["remotePatterns"]
> {
  const candidates = [
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),
    process.env.SUPABASE_URL?.trim(),
  ].filter((s): s is string => Boolean(s));

  const seen = new Set<string>();
  const patterns: NonNullable<
    NonNullable<NextConfig["images"]>["remotePatterns"]
  > = [];

  for (const raw of candidates) {
    try {
      const u = new URL(raw);
      const key = `${u.protocol}//${u.host}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      patterns.push({
        protocol: u.protocol.replace(":", "") as "http" | "https",
        hostname: u.hostname,
        ...(u.port ? { port: u.port } : {}),
        pathname: "/storage/v1/object/public/**",
      });
    } catch {
      // skip invalid URL
    }
  }

  return patterns;
}

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: supabaseStorageRemotePatterns(),
  },
};

export default nextConfig;
