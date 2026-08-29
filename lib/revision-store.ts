import { env } from 'cloudflare:workers';

import { subtopicSeedsForTopic } from '@/data/subtopic-seed';
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

const subtopicTableSql = `CREATE TABLE IF NOT EXISTS subtopics (
  id TEXT PRIMARY KEY,
  topic_id TEXT NOT NULL,
  label TEXT NOT NULL,
  covered INTEGER NOT NULL DEFAULT 0,
  covered_at TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  source_url TEXT,
  created_at TEXT NOT NULL,
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
    db.prepare(subtopicTableSql),
    db.prepare(
      'CREATE INDEX IF NOT EXISTS topics_due_idx ON topics(next_due_at, target_date)',
    ),
    db.prepare(
      'CREATE INDEX IF NOT EXISTS revisions_topic_idx ON revisions(topic_id, revised_at)',
    ),
    db.prepare(
      'CREATE INDEX IF NOT EXISTS subtopics_topic_idx ON subtopics(topic_id, sort_order)',
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

  const latestSeed = topicSeeds.at(-1);
  const seedExists = latestSeed
    ? await db
        .prepare('SELECT 1 AS present FROM topics WHERE id = ?')
        .bind(latestSeed.id)
        .first<{ present: number }>()
    : { present: 1 };

  if (!seedExists) {
    await db.batch(
      topicSeeds.map((topic) =>
        db
          .prepare(
            `INSERT OR IGNORE INTO topics (
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

  const topicsWithoutSubtopics = await db
    .prepare(
      `SELECT t.id, t.subject, t.source_url, t.status
      FROM topics t
      WHERE NOT EXISTS (
        SELECT 1 FROM subtopics s WHERE s.topic_id = t.id
      )`,
    )
    .all<{
      id: string;
      subject: string;
      source_url: string | null;
      status: string;
    }>();

  const missingSubtopics = topicsWithoutSubtopics.results.flatMap((topic) =>
    subtopicSeedsForTopic({
      id: topic.id,
      subject: topic.subject,
      sourceUrl: topic.source_url ?? '',
    }).map((subtopic) => ({
      ...subtopic,
      covered: topic.status === 'covered' ? 1 : 0,
    })),
  );

  if (missingSubtopics.length) {
    await db.batch(
      missingSubtopics.map((subtopic) =>
        db
          .prepare(
            `INSERT OR IGNORE INTO subtopics (
              id, topic_id, label, covered, covered_at, sort_order,
              source_url, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            subtopic.id,
            subtopic.topicId,
            subtopic.label,
            subtopic.covered,
            subtopic.covered ? now : null,
            subtopic.sortOrder,
            subtopic.sourceUrl,
            now,
            now,
          ),
      ),
    );
  }

  await db.prepare('PRAGMA optimize').run();

  return db;
}

export function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
