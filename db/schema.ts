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
  createdAt: text('created_at').notNull(),
});
