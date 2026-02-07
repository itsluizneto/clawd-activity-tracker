const path = require('path');
const Database = require('better-sqlite3');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'data.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  details TEXT,
  tags TEXT
);
CREATE INDEX IF NOT EXISTS idx_activities_ts ON activities(ts);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
`);

module.exports = db;
