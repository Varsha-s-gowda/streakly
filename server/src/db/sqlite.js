import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@libsql/client';
import { env } from '../config/env.js';

let client = null;

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    tracking_start TEXT NOT NULL,
    last_login_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    section TEXT NOT NULL DEFAULT 'custom',
    scheduled_time TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium',
    required INTEGER NOT NULL DEFAULT 0,
    recurrence TEXT NOT NULL DEFAULT 'daily',
    activity_date TEXT,
    start_date TEXT NOT NULL,
    archived INTEGER NOT NULL DEFAULT 0,
    archived_on TEXT,
    is_default INTEGER NOT NULL DEFAULT 0,
    is_custom INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_activities_user_date ON activities (user_id, start_date, archived)`,
  `CREATE INDEX IF NOT EXISTS idx_activities_user_section ON activities (user_id, section)`,
  `CREATE TABLE IF NOT EXISTS daily_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    date TEXT NOT NULL,
    statuses TEXT NOT NULL DEFAULT '[]',
    total_activities INTEGER NOT NULL DEFAULT 0,
    completed_activities INTEGER NOT NULL DEFAULT 0,
    required_total INTEGER NOT NULL DEFAULT 0,
    required_completed INTEGER NOT NULL DEFAULT 0,
    completion_percent INTEGER NOT NULL DEFAULT 0,
    is_complete INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (user_id, date)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_daily_logs_user_complete ON daily_logs (user_id, is_complete, date)`,
  `CREATE TABLE IF NOT EXISTS habits (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    is_default INTEGER NOT NULL DEFAULT 0,
    archived INTEGER NOT NULL DEFAULT 0,
    archived_on TEXT,
    start_date TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_habits_user ON habits (user_id, archived, start_date)`,
  `CREATE TABLE IF NOT EXISTS habit_entries (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    habit_id TEXT NOT NULL,
    date TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (user_id, habit_id, date)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_habit_entries_user_date ON habit_entries (user_id, date)`,
  `CREATE TABLE IF NOT EXISTS journals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    date TEXT NOT NULL,
    achievements TEXT NOT NULL DEFAULT '',
    gratitude TEXT NOT NULL DEFAULT '{}',
    reflection TEXT NOT NULL DEFAULT '{}',
    manifestation TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (user_id, date)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_journals_user_date ON journals (user_id, date)`,
  `CREATE TABLE IF NOT EXISTS interview_topics (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    subject TEXT NOT NULL,
    title TEXT NOT NULL,
    parent_id TEXT,
    status TEXT NOT NULL DEFAULT 'not-started',
    difficulty TEXT NOT NULL DEFAULT 'medium',
    notes TEXT NOT NULL DEFAULT '',
    target_minutes INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    archived INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_interview_topics_user ON interview_topics (user_id, subject, archived)`,
  `CREATE TABLE IF NOT EXISTS interview_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    date TEXT NOT NULL,
    subject TEXT NOT NULL,
    topic_id TEXT,
    minutes INTEGER NOT NULL,
    problems_solved INTEGER NOT NULL DEFAULT 0,
    difficult_questions TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_date ON interview_sessions (user_id, date)`,
  `CREATE TABLE IF NOT EXISTS interview_targets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    subject TEXT NOT NULL,
    daily_minutes INTEGER NOT NULL DEFAULT 60,
    weekly_minutes INTEGER NOT NULL DEFAULT 300,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (user_id, subject)
  )`,
  `CREATE TABLE IF NOT EXISTS reminders (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL DEFAULT '',
    time TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    is_default INTEGER NOT NULL DEFAULT 0,
    days TEXT NOT NULL DEFAULT '[0,1,2,3,4,5,6]',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_reminders_user ON reminders (user_id, time, sort_order)`,
];

function resolveFileUrl(url) {
  if (!url.startsWith('file:')) return null;
  const raw = url.slice('file:'.length);
  if (!raw || raw === ':memory:') return null;
  return path.resolve(raw);
}

export async function connectDatabase() {
  if (client) return client;

  const filePath = resolveFileUrl(env.databaseUrl);
  if (filePath) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  }

  client = createClient({
    url: env.databaseUrl,
    authToken: env.databaseAuthToken || undefined,
  });

  for (const statement of SCHEMA) {
    await client.execute(statement);
  }

  const location = filePath || env.databaseUrl.replace(/\/\/.*@/, '//');
  console.log(`[db] Connected to SQLite at ${location}`);
  return client;
}

export function getDb() {
  if (!client) throw new Error('Database has not been connected yet.');
  return client;
}

export async function disconnectDatabase() {
  if (client) {
    client.close();
    client = null;
  }
}

export async function all(sql, args = []) {
  const result = await getDb().execute({ sql, args });
  return result.rows;
}

export async function get(sql, args = []) {
  const rows = await all(sql, args);
  return rows[0] || null;
}

export async function run(sql, args = []) {
  return getDb().execute({ sql, args });
}
