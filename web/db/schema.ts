import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core';

export const topics = sqliteTable('topics', {
  id: text('id').primaryKey(),
  repository: text('repository').notNull(),
  subject: text('subject').notNull(),
  title: text('title').notNull(),
  status: text('status').notNull().default('not_covered'),
  confidence: text('confidence'),
  priority: text('priority').notNull().default('normal'),
  targetDate: text('target_date'),
  lastRevisedAt: text('last_revised_at'),
  nextDueAt: text('next_due_at'),
  revisionCount: integer('revision_count').notNull().default(0),
  recallStreak: integer('recall_streak').notNull().default(0),
  proof: text('proof').notNull().default(''),
  notes: text('notes').notNull().default(''),
  urgencyOverride: text('urgency_override'),
  estimatedMinutes: integer('estimated_minutes').notNull().default(30),
  sourceUrl: text('source_url'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const revisions = sqliteTable('revisions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  topicId: text('topic_id').notNull(),
  mark: text('mark').notNull(),
  revisedAt: text('revised_at').notNull(),
  nextDueAt: text('next_due_at').notNull(),
  proof: text('proof').notNull().default(''),
  notes: text('notes').notNull().default(''),
  durationMinutes: integer('duration_minutes').notNull().default(0),
  reflection: text('reflection').notNull().default(''),
  mood: text('mood').notNull().default('steady'),
  mistakeCategory: text('mistake_category').notNull().default('none'),
  repairAction: text('repair_action').notNull().default(''),
  createdAt: text('created_at').notNull(),
});

export const revisionSettings = sqliteTable('revision_settings', {
  id: text('id').primaryKey(),
  urgentWindowDays: integer('urgent_window_days').notNull().default(0),
  yellowWindowDays: integer('yellow_window_days').notNull().default(3),
  missedIntervalDays: integer('missed_interval_days').notNull().default(1),
  hesitantIntervalDays: integer('hesitant_interval_days').notNull().default(3),
  recalledFirstDays: integer('recalled_first_days').notNull().default(7),
  recalledSecondDays: integer('recalled_second_days').notNull().default(14),
  recalledMasteredDays: integer('recalled_mastered_days').notNull().default(30),
  dailyGoalMinutes: integer('daily_goal_minutes').notNull().default(60),
  focusBlockMinutes: integer('focus_block_minutes').notNull().default(30),
  updatedAt: text('updated_at').notNull(),
});

export const subtopics = sqliteTable('subtopics', {
  id: text('id').primaryKey(),
  topicId: text('topic_id').notNull(),
  label: text('label').notNull(),
  covered: integer('covered', { mode: 'boolean' }).notNull().default(false),
  coveredAt: text('covered_at'),
  sortOrder: integer('sort_order').notNull().default(0),
  sourceUrl: text('source_url'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const todoItems = sqliteTable('todo_items', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  notes: text('notes').notNull().default(''),
  category: text('category').notNull().default('Personal'),
  priority: text('priority').notNull().default('normal'),
  dueAt: text('due_at'),
  reminderAt: text('reminder_at'),
  status: text('status').notNull().default('open'),
  completedAt: text('completed_at'),
  archivedAt: text('archived_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const hdlbitsPracticeSessions = sqliteTable(
  'hdlbits_practice_sessions',
  {
    id: text('id').primaryKey(),
    seedQuestionId: text('seed_question_id').notNull(),
    questionIds: text('question_ids').notNull(),
    seriesId: text('series_id'),
    seriesName: text('series_name'),
    mode: text('mode').notNull(),
    focus: text('focus').notNull(),
    status: text('status').notNull().default('active'),
    currentIndex: integer('current_index').notNull().default(0),
    timeLimitMinutes: integer('time_limit_minutes').notNull(),
    outcome: text('outcome'),
    startedAt: text('started_at').notNull(),
    completedAt: text('completed_at'),
    updatedAt: text('updated_at').notNull(),
  },
);

export const mavenMigrations = sqliteTable('maven_migrations', {
  id: text('id').primaryKey(),
  appliedAt: text('applied_at').notNull(),
});

export const mavenArchive = sqliteTable('maven_archive', {
  id: text('id').primaryKey(),
  sourceTable: text('source_table').notNull(),
  payload: text('payload').notNull(),
  archivedAt: text('archived_at').notNull(),
});

export const mavenProfile = sqliteTable('maven_profile', {
  id: text('id').primaryKey(),
  currentAssignment: integer('current_assignment').notNull().default(7),
  updatedAt: text('updated_at').notNull(),
});

export const mavenEntries = sqliteTable('maven_entries', {
  id: text('id').primaryKey(),
  kind: text('kind').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull().default(''),
  assignmentNumber: integer('assignment_number'),
  questionNumber: integer('question_number'),
  status: text('status').notNull().default('open'),
  answer: text('answer').notNull().default(''),
  trainer: text('trainer').notNull().default(''),
  reviewDate: text('review_date'),
  repairAction: text('repair_action').notNull().default(''),
  sourceUrl: text('source_url'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const mavenAttachments = sqliteTable('maven_attachments', {
  id: text('id').primaryKey(),
  entryId: text('entry_id').notNull(),
  name: text('name').notNull(),
  mimeType: text('mime_type').notNull(),
  byteLength: integer('byte_length').notNull(),
  sha256: text('sha256').notNull(),
  dataBase64: text('data_base64').notNull(),
  createdAt: text('created_at').notNull(),
});

export const mavenAttachmentChunks = sqliteTable(
  'maven_attachment_chunks',
  {
    attachmentId: text('attachment_id').notNull(),
    chunkIndex: integer('chunk_index').notNull(),
    dataBase64: text('data_base64').notNull(),
  },
  (table) => [primaryKey({ columns: [table.attachmentId, table.chunkIndex] })],
);

export const mavenEvents = sqliteTable('maven_events', {
  id: text('id').primaryKey(),
  message: text('message').notNull(),
  createdAt: text('created_at').notNull(),
});
