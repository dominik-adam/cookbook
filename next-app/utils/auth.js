// Admin accounts that share data (bag, recipe states, etc.)
const ADMIN_ACCOUNTS = [
  'adam.dominik@gmail.com',
  'ttodova@gmail.com'
];

// Primary account for shared admin data
const PRIMARY_ADMIN_EMAIL = 'adam.dominik@gmail.com';

/**
 * Check if an email belongs to an admin account
 * @param {string} email - User email to check
 * @returns {boolean} - True if user is an admin
 */
export function isAdmin(email) {
  return ADMIN_ACCOUNTS.includes(email);
}

/**
 * Get the canonical email for data storage.
 * Admin accounts are aliased to a single primary account for shared data.
 * Regular users get their own email.
 *
 * @param {string} email - User email from session
 * @returns {string} - Canonical email for database queries
 */
export function getCanonicalEmail(email) {
  if (ADMIN_ACCOUNTS.includes(email)) {
    return PRIMARY_ADMIN_EMAIL;
  }
  return email;
}

/**
 * Get all admin emails (for checking permissions)
 * @returns {string[]} - Array of admin emails
 */
export function getAdminEmails() {
  return [...ADMIN_ACCOUNTS];
}