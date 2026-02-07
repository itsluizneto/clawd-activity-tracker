const path = require('path');
const Fastify = require('fastify');
const cors = require('@fastify/cors');
const statik = require('@fastify/static');
const dayjs = require('dayjs');

const db = require('./db');

const app = Fastify({ logger: true });

app.register(cors, { origin: true });
app.register(statik, {
  root: path.join(__dirname, 'public'),
  prefix: '/',
});

function parseTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map(String).map(t => t.trim()).filter(Boolean);
  return String(tags)
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);
}

app.get('/api/health', async () => ({ ok: true }));

app.get('/api/activities', async (req) => {
  const limit = Math.min(Number(req.query.limit || 200), 1000);
  const offset = Math.max(Number(req.query.offset || 0), 0);
  const rows = db
    .prepare(
      `SELECT id, ts, type, title, details, tags
       FROM activities
       ORDER BY ts DESC
       LIMIT ? OFFSET ?`
    )
    .all(limit, offset)
    .map(r => ({
      ...r,
      iso: new Date(r.ts).toISOString(),
      tags: r.tags ? JSON.parse(r.tags) : [],
    }));
  return { rows, limit, offset };
});

app.post('/api/activities', async (req, reply) => {
  const body = req.body || {};
  const ts = body.ts ? Number(body.ts) : Date.now();
  const type = String(body.type || 'work').trim();
  const title = String(body.title || '').trim();
  const details = body.details == null ? null : String(body.details);
  const tags = parseTags(body.tags);

  if (!title) return reply.code(400).send({ error: 'title is required' });

  const info = db
    .prepare('INSERT INTO activities (ts, type, title, details, tags) VALUES (?, ?, ?, ?, ?)')
    .run(ts, type, title, details, JSON.stringify(tags));

  return { ok: true, id: info.lastInsertRowid };
});

app.get('/api/stats', async (req) => {
  const days = Math.min(Number(req.query.days || 14), 120);
  const since = dayjs().subtract(days - 1, 'day').startOf('day').valueOf();

  const byDay = db
    .prepare(
      `SELECT 
         CAST((ts / 86400000) AS INTEGER) AS dayBucket,
         COUNT(*) AS n
       FROM activities
       WHERE ts >= ?
       GROUP BY dayBucket
       ORDER BY dayBucket ASC`
    )
    .all(since);

  const byType = db
    .prepare(
      `SELECT type, COUNT(*) AS n
       FROM activities
       WHERE ts >= ?
       GROUP BY type
       ORDER BY n DESC`
    )
    .all(since);

  const total = db
    .prepare('SELECT COUNT(*) AS n FROM activities WHERE ts >= ?')
    .get(since).n;

  return { days, since, total, byDay, byType };
});

const port = Number(process.env.PORT || 3030);
const host = process.env.HOST || '0.0.0.0';

app.listen({ port, host }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
