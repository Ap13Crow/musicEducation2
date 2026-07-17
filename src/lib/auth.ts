/**
 * Auth library - PBKDF2 password hashing, TOTP generation/verification,
 * and session management for email/password authentication.
 *
 * All crypto operations use the Web Crypto API (SubtleCrypto), so
 * passwords are never exposed in plaintext beyond the initial entry.
 */

const PBKDF2_ITERATIONS = 120000;
const PBKDF2_HASH = 'SHA-256';
const PBKDF2_KEY_LEN = 256;
const SALT_BYTES = 16;

const TOTP_PERIOD = 30;
const TOTP_DIGITS = 6;
const TOTP_ALGO = 'SHA-1';

const SESSION_KEY = 'mmc:session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/* ------------------------------------------------------------------ */
/*  Base32 (RFC 4648)  minimal encode/decode for TOTP secrets        */
/* ------------------------------------------------------------------ */

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    out += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  const pad = (8 - (out.length % 8)) % 8;
  return out + '='.repeat(pad);
}

function base32Decode(input: string): Uint8Array {
  const str = input.toUpperCase().replace(/=+$/, '').replace(/[^A-Z2-7]/g, '');
  const out = new Uint8Array(Math.floor((str.length * 5) / 8));
  let bits = 0;
  let value = 0;
  let idx = 0;
  for (const ch of str) {
    value = (value << 5) | BASE32_ALPHABET.indexOf(ch);
    bits += 5;
    if (bits >= 8) {
      out[idx++] = (value >>> (bits - 8)) & 255;
      bits -= 8;
    }
  }
  return out.slice(0, idx);
}

/* ------------------------------------------------------------------ */
/*  Password hashing (PBKDF2)                                         */
/* ------------------------------------------------------------------ */

/** Hash a password with a random salt. Returns "salt:hash" (both base64). */
export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'],
  );
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: PBKDF2_HASH },
    key,
    PBKDF2_KEY_LEN,
  );
  const saltB64 = btoa(String.fromCharCode(...salt));
  const hashB64 = btoa(String.fromCharCode(...new Uint8Array(derived)));
  return `${saltB64}:${hashB64}`;
}

/** Verify a password against a stored "salt:hash" string. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltB64, hashB64] = stored.split(':');
  if (!saltB64 || !hashB64) return false;
  try {
    const salt = Uint8Array.from(atob(saltB64), (c) => c.charCodeAt(0));
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'],
    );
    const derived = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: PBKDF2_HASH },
      key,
      PBKDF2_KEY_LEN,
    );
    const hashB64Check = btoa(String.fromCharCode(...new Uint8Array(derived)));
    return hashB64Check === hashB64;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/*  TOTP (RFC 6238)                                                   */
/* ------------------------------------------------------------------ */

/** Generate a new random TOTP secret (20 bytes, base32 encoded). */
export function generateTOTPSecret(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  return base32Encode(bytes);
}

/** Build an otpauth:// URI for QR code generation. */
export function buildTOTPUri(email: string, secret: string, issuer = 'MyMusicCoach'): string {
  const encIssuer = encodeURIComponent(issuer);
  const encEmail = encodeURIComponent(email);
  return `otpauth://totp/${encIssuer}:${encEmail}?secret=${secret}&issuer=${encIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/** Verify a 6-digit TOTP code against a base32-encoded secret. */
export async function verifyTOTP(code: string, secretBase32: string): Promise<boolean> {
  if (code.length !== TOTP_DIGITS || !/^\d+$/.test(code)) return false;
  const secret = base32Decode(secretBase32);
  if (secret.length === 0) return false;

  const now = Math.floor(Date.now() / 1000);
  const counter = Math.floor(now / TOTP_PERIOD);

  // Check current and adjacent windows (±1)
  for (let offset = -1; offset <= 1; offset++) {
    const c = counter + offset;
    if (c < 0) continue;
    const expected = await computeTOTP(secret, c);
    if (expected === code) return true;
  }
  return false;
}

async function computeTOTP(secret: Uint8Array, counter: number): Promise<string> {
  const counterBuf = new ArrayBuffer(8);
  new DataView(counterBuf).setBigUint64(0, BigInt(counter), false);
  const key = await crypto.subtle.importKey(
    'raw', secret, { name: 'HMAC', hash: TOTP_ALGO }, false, ['sign'],
  );
  const hmac = await crypto.subtle.sign('HMAC', key, counterBuf);
  const hmacBytes = new Uint8Array(hmac);
  const offset = hmacBytes[hmacBytes.length - 1] & 0x0f;
  const binary =
    ((hmacBytes[offset] & 0x7f) << 24) |
    ((hmacBytes[offset + 1] & 0xff) << 16) |
    ((hmacBytes[offset + 2] & 0xff) << 8) |
    (hmacBytes[offset + 3] & 0xff);
  const otp = binary % 10 ** TOTP_DIGITS;
  return otp.toString().padStart(TOTP_DIGITS, '0');
}

/* ------------------------------------------------------------------ */
/*  Session management                                                 */
/* ------------------------------------------------------------------ */

export interface Session {
  email: string;
  role: string;
  displayName: string;
  nodeId: string;
  mfaVerified: boolean;
  expiresAt: number;
}

export function saveSession(s: Omit<Session, 'expiresAt'>): void {
  const session: Session = {
    ...s,
    mfaVerified: s.mfaVerified,
    expiresAt: Date.now() + SESSION_TTL_MS,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s: Session = JSON.parse(raw);
    if (Date.now() > s.expiresAt) {
      clearSession();
      return null;
    }
    return s;
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}
