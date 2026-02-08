const crypto = require('crypto');

const COOKIE_NAME = 'clawd_taskboard';

function b64url(buf) {
  return Buffer.from(buf).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function sign(payload, secret) {
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(crypto.createHmac('sha256', secret).update(body).digest());
  return `${body}.${sig}`;
}

function verify(token, secret) {
  if (!token || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const expected = b64url(crypto.createHmac('sha256', secret).update(body).digest());
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function parseCookie(header) {
  if (!header) return {};
  const out = {};
  const parts = header.split(';');
  for (const p of parts) {
    const [k, ...rest] = p.trim().split('=');
    if (!k) continue;
    out[k] = rest.join('=');
  }
  return out;
}

function requireAuth(event) {
  const secret = process.env.COOKIE_SECRET;
  if (!secret) throw new Error('Missing COOKIE_SECRET');
  const cookies = parseCookie(event.headers?.cookie || event.headers?.Cookie);
  const token = cookies[COOKIE_NAME];
  const payload = verify(token, secret);
  if (!payload) return { ok: false };
  return { ok: true, payload };
}

function loginCookie() {
  const password = process.env.APP_PASSWORD;
  const secret = process.env.COOKIE_SECRET;
  if (!password) throw new Error('Missing APP_PASSWORD');
  if (!secret) throw new Error('Missing COOKIE_SECRET');

  const payload = {
    v: 1,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 14, // 14d
  };
  const token = sign(payload, secret);

  // Secure only over HTTPS; Netlify is HTTPS.
  const cookie = `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 14}`;
  return cookie;
}

module.exports = { requireAuth, loginCookie, COOKIE_NAME };
