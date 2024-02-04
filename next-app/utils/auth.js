import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

export function isAdmin(email) {
  const adminEmails = process.env.ADMIN_EMAIL.split(',').map(email => email.trim());
  return adminEmails.includes(email);
}