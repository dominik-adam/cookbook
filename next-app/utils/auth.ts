// Admin accounts that share data (bag, recipe states, etc.)
const ADMIN_ACCOUNTS = [
  'adam.dominik@gmail.com',
  'ttodova@gmail.com'
] as const;

// Primary account for shared admin data
const PRIMARY_ADMIN_EMAIL = 'adam.dominik@gmail.com';

/**
 * Check if an email belongs to an admin account
 */
export function isAdmin(email: string): boolean {
  return ADMIN_ACCOUNTS.includes(email as typeof ADMIN_ACCOUNTS[number]);
}

/**
 * Get the canonical email for data storage.
 * Admin accounts are aliased to a single primary account for shared data.
 * Regular users get their own email.
 */
export function getCanonicalEmail(email: string): string {
  if (ADMIN_ACCOUNTS.includes(email as typeof ADMIN_ACCOUNTS[number])) {
    return PRIMARY_ADMIN_EMAIL;
  }
  return email;
}

/**
 * Get all admin emails (for checking permissions)
 */
export function getAdminEmails(): readonly string[] {
  return ADMIN_ACCOUNTS;
}
