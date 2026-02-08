# Clawd Task Board

Simple private task board (ClickUp-lite) for tracking what Clawd is doing in plain English.

## Local dev

```bash
npm install
npm run dev
# open http://localhost:3030
```

## Netlify + Supabase

### Supabase
- Create a Supabase project
- Run `TASKS_SCHEMA.sql` in Supabase SQL editor

### Netlify env vars
Set these environment variables in Netlify:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side only)
- `APP_PASSWORD` (board password)
- `COOKIE_SECRET` (random long string)

Netlify settings are in `netlify.toml`.

API endpoints:
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET/POST /api/tasks`
