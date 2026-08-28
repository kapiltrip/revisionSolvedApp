import { env } from 'cloudflare:workers';

import { topicSeeds } from '@/data/topic-seed';

const topicTableSql = `CREATE TABLE IF NOT EXISTS topics (
  id TEXT PRIMARY KEY,
  repository TEXT NOT NULL,
  subject TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_covered',
  confidence TEXT,
  priority TEXT NOT NULL DEFAULT 'normal',
  target_date TEXT,
  last_revised_at TEXT,
  next_due_at TEXT,
  revision_count INTEGER NOT NULL DEFAULT 0,
  recall_streak INTEGER NOT NULL DEFAULT 0,
  proof TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  source_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)`;

const revisionTableSql = `CREATE TABLE IF NOT EXISTS revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id TEXT NOT NULL,
  mark TEXT NOT NULL,
  revised_at TEXT NOT NULL,
  next_due_at TEXT NOT NULL,
  proof TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
)`;

export async function getRevisionStore() {
  if (!env.DB) {
    throw new Error('Revision database is unavailable.');
  }

  const db = env.DB;
  await db.batch([
    db.prepare(topicTableSql),
    db.prepare(revisionTableSql),
    db.prepare(
      'CREATE INDEX IF NOT EXISTS topics_due_idx ON topics(next_due_at, target_date)',
    ),
    db.prepare(
      'CREATE INDEX IF NOT EXISTS revisions_topic_idx ON revisions(topic_id, revised_at)',
    ),
  ]);

  const countRow = await db
    .prepare('SELECT COUNT(*) AS count FROM topics')
    .first<{ count: number }>();

  if (Number(countRow?.count ?? 0) === 0) {
    const now = new Date().toISOString();
    await db.batch(
      topicSeeds.map((topic) =>
        db
          .prepare(
            `INSERT INTO topics (
              id, repository, subject, title, priority, target_date,
              source_url, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            topic.id,
            topic.repository,
            topic.subject,
            topic.title,
            topic.priority,
            topic.targetDate,
            topic.sourceUrl,
            now,
            now,
          ),
      ),
    );
  }

  return db;
}

export function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
