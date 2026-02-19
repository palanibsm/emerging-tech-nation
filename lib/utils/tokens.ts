import { randomBytes } from 'crypto';

/**
 * Generates a cryptographically secure URL-safe token (256-bit entropy).
 */
export function generateToken(): string {
  return randomBytes(32).toString('base64url').slice(0, 43);
}

/**
 * Builds a full action URL for email links.
 */
export function buildActionUrl(
  token: string,
  action: 'select' | 'approve',
  topicIndex?: number
): string {
  const base = process.env.SITE_URL ?? '';
  const params = new URLSearchParams({ token, action });
  if (topicIndex !== undefined) {
    params.set('topic', topicIndex.toString());
  }
  return `${base}/api/workflow/action?${params.toString()}`;
}
