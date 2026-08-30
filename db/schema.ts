import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

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
