export type ExpiryStatus = 'expired' | 'soon' | 'ok' | 'none';

export function getExpiryStatus(expiry: string | Date | null | undefined): ExpiryStatus {
  if (!expiry) return 'none';
  const d = new Date(expiry);
  if (isNaN(d.getTime())) return 'none';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(d);
  exp.setHours(0, 0, 0, 0);
  if (exp <= today) return 'expired';
  const limit = new Date(today);
  limit.setDate(today.getDate() + 30);
  return exp <= limit ? 'soon' : 'ok';
}

export const EXPIRY_CSS: Record<ExpiryStatus, string> = {
  expired: 'expiryExpired',
  soon: 'expirySoon',
  ok: 'expiryOk',
  none: 'expiryNone',
};
