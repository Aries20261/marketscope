import { randomInt } from 'node:crypto';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

/** Password acak untuk reset oleh admin (16 karakter, tanpa karakter yang mirip). */
export function generatePassword(length = 16): string {
  let out = '';
  for (let i = 0; i < length; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

export function checkPasswordStrength(pw: string): string | null {
  if (pw.length < 10) return 'Password minimal 10 karakter.';
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'Password harus berisi huruf dan angka.';
  if (/^(.)\1+$/.test(pw)) return 'Password terlalu mudah ditebak.';
  return null;
}
