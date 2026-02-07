const { getSupabase } = require('./_supabase');

function json(statusCode, data) {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json',
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'content-type',
      'access-control-allow-methods': 'GET,POST,OPTIONS',
    },
    body: JSON.stringify(data),
  };
}

function parseTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map(String).map(t => t.trim()).filter(Boolean);
  return String(tags)
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });

  const supabase = getSupabase();

  if (event.httpMethod === 'GET') {
    const qs = event.queryStringParameters || {};
    const limit = Math.min(Number(qs.limit || 200), 1000);
    const offset = Math.max(Number(qs.offset || 0), 0);

    const { data, error } = await supabase
      .from('activities')
      .select('id, ts, type, title, details, tags')
      .order('ts', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return json(500, { error: error.message });
    return json(200, { rows: data || [], limit, offset });
  }

  if (event.httpMethod === 'POST') {
    let body = {};
    try {
      body = event.body ? JSON.parse(event.body) : {};
    } catch {
      return json(400, { error: 'Invalid JSON body' });
    }

    const ts = body.ts ? Number(body.ts) : Date.now();
    const type = String(body.type || 'work').trim();
    const title = String(body.title || '').trim();
    const details = body.details == null ? null : String(body.details);
    const tags = parseTags(body.tags);

    if (!title) return json(400, { error: 'title is required' });

    const { data, error } = await supabase
      .from('activities')
      .insert([{ ts, type, title, details, tags }])
      .select('id')
      .single();

    if (error) return json(500, { error: error.message });
    return json(200, { ok: true, id: data?.id });
  }

  return json(405, { error: 'Method not allowed' });
};
