# Clawd Activity Tracker

Tiny activity logger + dashboard.

## Local dev

```bash
npm install
npm run dev
# open http://localhost:3030
```

## Netlify + Supabase

- Create a Supabase project
- Run `SUPABASE_SCHEMA.sql` in Supabase SQL editor
- In Netlify set env vars:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

Netlify settings are in `netlify.toml`.

API endpoints are exposed at `/api/activities` and `/api/stats`.
