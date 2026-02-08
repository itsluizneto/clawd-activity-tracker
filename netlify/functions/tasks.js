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

const ALLOWED_STATUS = new Set(['backlog','in_progress','blocked','done']);

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });

  const supabase = getSupabase();

  if (event.httpMethod === 'GET') {
    const { data, error } = await supabase
      .from('tasks')
      .select('id, created_at, updated_at, status, title, summary, last_update, priority, tags')
      .order('priority', { ascending: true })
      .order('updated_at', { ascending: false });

    if (error) return json(500, { error: error.message });
    return json(200, { rows: data || [] });
  }

  if (event.httpMethod === 'POST') {
    let body = {};
    try { body = event.body ? JSON.parse(event.body) : {}; } catch { return json(400, { error: 'Invalid JSON body' }); }

    const id = body.id == null ? null : Number(body.id);
    const status = String(body.status || 'backlog');
    const title = String(body.title || '').trim();
    const summary = body.summary == null ? null : String(body.summary);
    const last_update = body.last_update == null ? null : String(body.last_update);
    const priority = body.priority == null ? 3 : Number(body.priority);
    const tags = parseTags(body.tags);

    if (!ALLOWED_STATUS.has(status)) return json(400, { error: 'Invalid status' });
    if (!title) return json(400, { error: 'title is required' });

    if (id) {
      const { error } = await supabase
        .from('tasks')
        .update({ status, title, summary, last_update, priority, tags })
        .eq('id', id);
      if (error) return json(500, { error: error.message });
      return json(200, { ok: true, id });
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert([{ status, title, summary, last_update, priority, tags }])
      .select('id')
      .single();

    if (error) return json(500, { error: error.message });
    return json(200, { ok: true, id: data?.id });
  }

  return json(405, { error: 'Method not allowed' });
};
