export const AFTER_SIGN_IN = "/studio";

/** Where to go after signing in. Only paths on this site are allowed. */
export function safeRedirect(target: string | null | undefined): string {
  if (!target || !target.startsWith("/") || /^\/[/\\]/.test(target)) return AFTER_SIGN_IN;
  // Never bounce back to the pages people come here from
  if (/^\/(login|signup|auth)(\/|\?|$)/.test(target)) return AFTER_SIGN_IN;
  return target;
}
