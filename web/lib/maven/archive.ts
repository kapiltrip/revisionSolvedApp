// Run these statements together in D1.batch: the snapshot and removal are atomic.
export const mavenSchema = [
  `CREATE TABLE IF NOT EXISTS maven_migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS maven_archive (id TEXT PRIMARY KEY, source_table TEXT NOT NULL, payload TEXT NOT NULL, archived_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS maven_profile (id TEXT PRIMARY KEY, current_assignment INTEGER NOT NULL DEFAULT 7, updated_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS maven_entries (
    id TEXT PRIMARY KEY, kind TEXT NOT NULL, title TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '', assignment_number INTEGER, question_number INTEGER,
    status TEXT NOT NULL DEFAULT 'open', answer TEXT NOT NULL DEFAULT '',
    trainer TEXT NOT NULL DEFAULT '', review_date TEXT, repair_action TEXT NOT NULL DEFAULT '',
    source_url TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS maven_attachments (
    id TEXT PRIMARY KEY, entry_id TEXT NOT NULL, name TEXT NOT NULL,
    mime_type TEXT NOT NULL, byte_length INTEGER NOT NULL, sha256 TEXT NOT NULL,
    data_base64 TEXT NOT NULL, created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS maven_events (id TEXT PRIMARY KEY, message TEXT NOT NULL, created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS maven_attachment_chunks (attachment_id TEXT NOT NULL, chunk_index INTEGER NOT NULL, data_base64 TEXT NOT NULL, PRIMARY KEY(attachment_id, chunk_index))`,
  `CREATE INDEX IF NOT EXISTS maven_entries_kind ON maven_entries(kind, updated_at)`,
  `CREATE INDEX IF NOT EXISTS maven_attachments_entry ON maven_attachments(entry_id)`,
];

const missing = `NOT EXISTS (SELECT 1 FROM maven_migrations WHERE id = 'maven-v1')`;
const legacy = `SELECT id FROM topics WHERE repository <> 'maven-silicon'`;

export function legacyArchiveStatements(now: string) {
  // Columns are explicit so backups remain understandable independently of this app.
  const tables: Array<[string, string[], string]> = [
    [
      "topics",
      [
        "id",
        "repository",
        "subject",
        "title",
        "status",
        "confidence",
        "priority",
        "target_date",
        "last_revised_at",
        "next_due_at",
        "revision_count",
        "recall_streak",
        "proof",
        "notes",
        "urgency_override",
        "estimated_minutes",
        "source_url",
        "created_at",
        "updated_at",
      ],
      "repository <> 'maven-silicon'",
    ],
    [
      "subtopics",
      [
        "id",
        "topic_id",
        "label",
        "covered",
        "covered_at",
        "sort_order",
        "source_url",
        "created_at",
        "updated_at",
      ],
      `topic_id IN (${legacy})`,
    ],
    [
      "revisions",
      [
        "id",
        "topic_id",
        "mark",
        "revised_at",
        "next_due_at",
        "proof",
        "notes",
        "duration_minutes",
        "reflection",
        "mood",
        "mistake_category",
        "repair_action",
        "created_at",
      ],
      `topic_id IN (${legacy})`,
    ],
    [
      "todo_items",
      [
        "id",
        "title",
        "notes",
        "category",
        "priority",
        "due_at",
        "reminder_at",
        "status",
        "completed_at",
        "archived_at",
        "created_at",
        "updated_at",
      ],
      "1=1",
    ],
    [
      "hdlbits_practice_sessions",
      [
        "id",
        "seed_question_id",
        "question_ids",
        "series_id",
        "series_name",
        "mode",
        "focus",
        "status",
        "current_index",
        "time_limit_minutes",
        "outcome",
        "started_at",
        "completed_at",
        "updated_at",
      ],
      "1=1",
    ],
    [
      "revision_settings",
      [
        "id",
        "urgent_window_days",
        "yellow_window_days",
        "missed_interval_days",
        "hesitant_interval_days",
        "recalled_first_days",
        "recalled_second_days",
        "recalled_mastered_days",
        "daily_goal_minutes",
        "focus_block_minutes",
        "updated_at",
      ],
      "1=1",
    ],
  ];
  const statements = tables.map(([table, columns, where]) => ({
    sql: `INSERT OR IGNORE INTO maven_archive (id,source_table,payload,archived_at)
      SELECT '${table}:' || id, '${table}', json_object(${columns.map((c) => `'${c}',${c}`).join(",")}), ?
      FROM ${table} WHERE ${where} AND ${missing}`,
    args: [now],
  }));
  for (const [table, condition] of [
    ["revisions", `topic_id IN (${legacy})`],
    ["subtopics", `topic_id IN (${legacy})`],
    ["topics", "repository <> 'maven-silicon'"],
    ["todo_items", "1=1"],
    ["hdlbits_practice_sessions", "1=1"],
  ])
    statements.push({ sql: `DELETE FROM ${table} WHERE ${condition} AND ${missing}`, args: [] });
  statements.push({
    sql: `INSERT OR IGNORE INTO maven_profile VALUES ('default',7,?)`,
    args: [now],
  });
  statements.push({
    sql: `INSERT OR IGNORE INTO maven_events VALUES ('maven-start','Maven Silicon revision workspace initialized. Current position: Digital Assignment 7.',?)`,
    args: [now],
  });
  statements.push({
    sql: `INSERT OR IGNORE INTO maven_migrations VALUES ('maven-v1',?)`,
    args: [now],
  });
  return statements;
}
