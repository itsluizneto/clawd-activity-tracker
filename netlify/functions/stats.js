const dayjs = require('dayjs');
const { getSupabase } = require('./_supabase');

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

  const supabase = getSupabase();
  const qs = event.queryStringParameters || {};
  const days = Math.min(Number(qs.days || 14), 120);
  const since = dayjs().subtract(days - 1, 'day').startOf('day').valueOf();

  // Pull just the fields needed for aggregation.
  const { data, error } = await supabase
    .from('activities')
    .select('ts,type')
    .gte('ts', since)
    .order('ts', { ascending: true });

  if (error) return json(500, { error: error.message });

  const rows = data || [];

  const byDayMap = new Map();
  const byTypeMap = new Map();

  for (const r of rows) {
    const dayBucket = Math.floor(Number(r.ts) / 86400000);
    byDayMap.set(dayBucket, (byDayMap.get(dayBucket) || 0) + 1);
    const t = r.type || 'work';
    byTypeMap.set(t, (byTypeMap.get(t) || 0) + 1);
  }

  const byDay = Array.from(byDayMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([dayBucket, n]) => ({ dayBucket, n }));

  const byType = Array.from(byTypeMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([type, n]) => ({ type, n }));

  return json(200, { days, since, total: rows.length, byDay, byType });
};
