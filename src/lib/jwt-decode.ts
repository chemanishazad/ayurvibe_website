/** Read JWT payload (no signature verify — use only to mirror server-issued claims in the SPA). */
export function decodeJwtPayload<T extends Record<string, unknown>>(token: string | null): T | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}
