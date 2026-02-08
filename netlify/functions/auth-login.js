const { loginCookie } = require('./_auth');

function json(statusCode, data, extraHeaders={}) {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json',
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'content-type',
      'access-control-allow-methods': 'POST,OPTIONS',
      ...extraHeaders,
    },
    body: JSON.stringify(data),
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  let body = {};
  try { body = event.body ? JSON.parse(event.body) : {}; } catch { return json(400, { error: 'Invalid JSON' }); }

  const password = process.env.APP_PASSWORD;
  if (!password) return json(500, { error: 'Server missing APP_PASSWORD' });

  if (String(body.password || '') !== password) {
    return json(401, { error: 'Invalid password' });
  }

  const setCookie = loginCookie();
  return json(200, { ok: true }, { 'set-cookie': setCookie });
};
