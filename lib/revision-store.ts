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
  urgency_override TEXT,
  estimated_minutes INTEGER NOT NULL DEFAULT 30,
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
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  reflection TEXT NOT NULL DEFAULT '',
  mood TEXT NOT NULL DEFAULT 'steady',
  created_at TEXT NOT NULL
)`;

const settingsTableSql = `CREATE TABLE IF NOT EXISTS revision_settings (
  id TEXT PRIMARY KEY,
  urgent_window_days INTEGER NOT NULL DEFAULT 0,
  yellow_window_days INTEGER NOT NULL DEFAULT 3,
  missed_interval_days INTEGER NOT NULL DEFAULT 1,
  hesitant_interval_days INTEGER NOT NULL DEFAULT 3,
  recalled_first_days INTEGER NOT NULL DEFAULT 7,
  recalled_second_days INTEGER NOT NULL DEFAULT 14,
  recalled_mastered_days INTEGER NOT NULL DEFAULT 30,
  updated_at TEXT NOT NULL
)`;

async function ensureColumns(db: D1Database) {
  const [topicInfo, revisionInfo] = await Promise.all([
    db.prepare('PRAGMA table_info(topics)').all<{ name: string }>(),
    db.prepare('PRAGMA table_info(revisions)').all<{ name: string }>(),
  ]);
  const topicColumns = new Set(topicInfo.results.map((column) => column.name));
  const revisionColumns = new Set(
    revisionInfo.results.map((column) => column.name),
  );
  const statements = [];

  if (!topicColumns.has('urgency_override')) {
    statements.push(
      db.prepare('ALTER TABLE topics ADD COLUMN urgency_override TEXT'),
    );
  }
  if (!topicColumns.has('estimated_minutes')) {
    statements.push(
      db.prepare(
        'ALTER TABLE topics ADD COLUMN estimated_minutes INTEGER NOT NULL DEFAULT 30',
      ),
    );
  }
  if (!revisionColumns.has('duration_minutes')) {
    statements.push(
      db.prepare(
        'ALTER TABLE revisions ADD COLUMN duration_minutes INTEGER NOT NULL DEFAULT 0',
      ),
    );
  }
  if (!revisionColumns.has('reflection')) {
    statements.push(
      db.prepare(
        "ALTER TABLE revisions ADD COLUMN reflection TEXT NOT NULL DEFAULT ''",
      ),
    );
  }
  if (!revisionColumns.has('mood')) {
    statements.push(
      db.prepare(
        "ALTER TABLE revisions ADD COLUMN mood TEXT NOT NULL DEFAULT 'steady'",
      ),
    );
  }

  if (statements.length) await db.batch(statements);
}

export async function getRevisionStore() {
  if (!env.DB) {
    throw new Error('Revision database is unavailable.');
  }

  const db = env.DB;
  await db.batch([
    db.prepare(topicTableSql),
    db.prepare(revisionTableSql),
    db.prepare(settingsTableSql),
    db.prepare(
      'CREATE INDEX IF NOT EXISTS topics_due_idx ON topics(next_due_at, target_date)',
    ),
    db.prepare(
      'CREATE INDEX IF NOT EXISTS revisions_topic_idx ON revisions(topic_id, revised_at)',
    ),
  ]);
  await ensureColumns(db);

  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT OR IGNORE INTO revision_settings (
        id, urgent_window_days, yellow_window_days, missed_interval_days,
        hesitant_interval_days, recalled_first_days, recalled_second_days,
        recalled_mastered_days, updated_at
      ) VALUES ('default', 0, 3, 1, 3, 7, 14, 30, ?)`,
    )
    .bind(now)
    .run();

  const countRow = await db
    .prepare('SELECT COUNT(*) AS count FROM topics')
    .first<{ count: number }>();

  if (Number(countRow?.count ?? 0) === 0) {
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
