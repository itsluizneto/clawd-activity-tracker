const { requireAuth } = require('./_auth');

function json(statusCode, data) {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json',
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'content-type',
      'access-control-allow-methods': 'GET,OPTIONS',
    },
    body: JSON.stringify(data),
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed' });

  const auth = requireAuth(event);
  if (!auth.ok) return json(401, { ok: false });
  return json(200, { ok: true });
};
