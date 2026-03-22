/**
 * 表示用の画像 URL。カスタムアバターがなければ OAuth 等の画像を使う。
 */
export function resolveAvatarImageUrl(
  profileAvatarUrl: string | null | undefined,
  sessionImage: string | null | undefined
): string | null {
  if (profileAvatarUrl) {
    return profileAvatarUrl;
  }
  if (sessionImage) {
    return sessionImage;
  }
  return null;
}
