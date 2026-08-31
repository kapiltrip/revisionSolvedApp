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
  mistake_category TEXT NOT NULL DEFAULT 'none',
  repair_action TEXT NOT NULL DEFAULT '',
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
  daily_goal_minutes INTEGER NOT NULL DEFAULT 60,
  focus_block_minutes INTEGER NOT NULL DEFAULT 30,
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

const todoTableSql = `CREATE TABLE IF NOT EXISTS todo_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Personal',
  priority TEXT NOT NULL DEFAULT 'normal',
  due_at TEXT,
  reminder_at TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  completed_at TEXT,
  archived_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)`;

const hdlbitsPracticeTableSql = `CREATE TABLE IF NOT EXISTS hdlbits_practice_sessions (
  id TEXT PRIMARY KEY,
  seed_question_id TEXT NOT NULL,
  question_ids TEXT NOT NULL,
  series_id TEXT,
  series_name TEXT,
  mode TEXT NOT NULL,
  focus TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  current_index INTEGER NOT NULL DEFAULT 0,
  time_limit_minutes INTEGER NOT NULL,
  outcome TEXT,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  updated_at TEXT NOT NULL
)`;

async function ensureColumns(db: D1Database) {
  const [topicInfo, revisionInfo, settingsInfo] = await Promise.all([
    db.prepare('PRAGMA table_info(topics)').all<{ name: string }>(),
    db.prepare('PRAGMA table_info(revisions)').all<{ name: string }>(),
    db.prepare('PRAGMA table_info(revision_settings)').all<{ name: string }>(),
  ]);
  const topicColumns = new Set(topicInfo.results.map((column) => column.name));
  const revisionColumns = new Set(
    revisionInfo.results.map((column) => column.name),
  );
  const settingsColumns = new Set(
    settingsInfo.results.map((column) => column.name),
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
  if (!revisionColumns.has('mistake_category')) {
    statements.push(
      db.prepare(
        "ALTER TABLE revisions ADD COLUMN mistake_category TEXT NOT NULL DEFAULT 'none'",
      ),
    );
  }
  if (!revisionColumns.has('repair_action')) {
    statements.push(
      db.prepare(
        "ALTER TABLE revisions ADD COLUMN repair_action TEXT NOT NULL DEFAULT ''",
      ),
    );
  }
  if (!settingsColumns.has('daily_goal_minutes')) {
    statements.push(
      db.prepare(
        'ALTER TABLE revision_settings ADD COLUMN daily_goal_minutes INTEGER NOT NULL DEFAULT 60',
      ),
    );
  }
  if (!settingsColumns.has('focus_block_minutes')) {
    statements.push(
      db.prepare(
        'ALTER TABLE revision_settings ADD COLUMN focus_block_minutes INTEGER NOT NULL DEFAULT 30',
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
    db.prepare(todoTableSql),
    db.prepare(hdlbitsPracticeTableSql),
    db.prepare(
      'CREATE INDEX IF NOT EXISTS topics_due_idx ON topics(next_due_at, target_date)',
    ),
    db.prepare(
      'CREATE INDEX IF NOT EXISTS revisions_topic_idx ON revisions(topic_id, revised_at)',
    ),
    db.prepare(
      'CREATE INDEX IF NOT EXISTS revisions_date_idx ON revisions(revised_at)',
    ),
    db.prepare(
      'CREATE INDEX IF NOT EXISTS topics_repository_idx ON topics(repository, status)',
    ),
    db.prepare(
      'CREATE INDEX IF NOT EXISTS subtopics_topic_idx ON subtopics(topic_id, sort_order)',
    ),
    db.prepare(
      `CREATE INDEX IF NOT EXISTS idx_todo_items_status_due
      ON todo_items(status, due_at) WHERE archived_at IS NULL`,
    ),
    db.prepare(
      `CREATE INDEX IF NOT EXISTS idx_hdlbits_sessions_status_started
      ON hdlbits_practice_sessions(status, started_at)`,
    ),
    db.prepare(
      `CREATE INDEX IF NOT EXISTS idx_hdlbits_sessions_seed_started
      ON hdlbits_practice_sessions(seed_question_id, started_at)`,
    ),
  ]);
  await ensureColumns(db);

  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT OR IGNORE INTO revision_settings (
        id, urgent_window_days, yellow_window_days, missed_interval_days,
        hesitant_interval_days, recalled_first_days, recalled_second_days,
        recalled_mastered_days, daily_goal_minutes, focus_block_minutes,
        updated_at
      ) VALUES ('default', 0, 3, 1, 3, 7, 14, 30, 60, 30, ?)`,
    )
    .bind(now)
    .run();

  const seedIds = topicSeeds.map((topic) => topic.id);
  const existingSeedRows = seedIds.length
    ? await db
        .prepare(
          `SELECT id FROM topics WHERE id IN (${seedIds.map(() => '?').join(', ')})`,
        )
        .bind(...seedIds)
        .all<{ id: string }>()
    : { results: [] as Array<{ id: string }> };
  const existingSeedIds = new Set(
    existingSeedRows.results.map((topic) => topic.id),
  );
  const missingTopicSeeds = topicSeeds.filter(
    (topic) => !existingSeedIds.has(topic.id),
  );

  if (missingTopicSeeds.length) {
    await db.batch(
      missingTopicSeeds.map((topic) =>
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
