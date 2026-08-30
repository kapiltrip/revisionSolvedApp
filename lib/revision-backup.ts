import { isDateKey } from './revision-engine.ts';

const repositories = new Set([
  'revision-solved',
  'systemverilog-from-beginning',
  'cpp-and-scripting-practice',
  'hdlbits',
]);
const statuses = new Set(['not_covered', 'in_progress', 'covered']);
const marks = new Set(['R', 'H', 'M']);
const priorities = new Set(['high', 'medium', 'normal']);
const urgencies = new Set(['urgent', 'soon', 'ready']);
const moods = new Set(['drained', 'foggy', 'steady', 'energized']);
const mistakeCategories = new Set([
  'none',
  'syntax',
  'logic',
  'timing',
  'state',
  'interface',
  'verification',
  'memory',
]);

type UnknownRecord = Record<string, unknown>;

function record(value: unknown): UnknownRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function text(value: unknown, max: number, fallback = '') {
  return typeof value === 'string' ? value.trim().slice(0, max) : fallback;
}

function nullableText(value: unknown, max: number) {
  const parsed = text(value, max);
  return parsed || null;
}

function integer(value: unknown, fallback: number, min: number, max: number) {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number.parseInt(value, 10)
        : Number.NaN;
  return Number.isFinite(parsed)
    ? Math.min(max, Math.max(min, Math.round(parsed)))
    : fallback;
}

function enumValue<T extends string>(
  value: unknown,
  allowed: Set<string>,
  fallback: T,
) {
  return typeof value === 'string' && allowed.has(value)
    ? (value as T)
    : fallback;
}

function nullableEnum<T extends string>(value: unknown, allowed: Set<string>) {
  return typeof value === 'string' && allowed.has(value) ? (value as T) : null;
}

function date(value: unknown) {
  return isDateKey(value) ? value : null;
}

function timestamp(value: unknown, fallback: string) {
  if (typeof value !== 'string') return fallback;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : fallback;
}

function sourceUrl(value: unknown) {
  const candidate = nullableText(value, 2000);
  if (!candidate) return null;
  try {
    const parsed = new URL(candidate);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
      ? candidate
      : null;
  } catch {
    return null;
  }
}

export type ParsedRevisionBackup = ReturnType<typeof parseRevisionBackup>;

export function parseRevisionBackup(
  value: unknown,
  now = new Date().toISOString(),
) {
  const root = record(value);
  if (!root) throw new Error('Backup must be a JSON object.');
  const rawTopics = Array.isArray(root.topics) ? root.topics : null;
  const rawSubtopics = Array.isArray(root.subtopics) ? root.subtopics : null;
  const rawRevisions = Array.isArray(root.revisions) ? root.revisions : null;
  const rawSettings = record(root.settings);
  if (!rawTopics || !rawSubtopics || !rawRevisions || !rawSettings) {
    throw new Error(
      'Backup is missing topics, quick checks, revisions, or settings.',
    );
  }
  if (
    rawTopics.length > 1000 ||
    rawSubtopics.length > 10000 ||
    rawRevisions.length > 5000
  ) {
    throw new Error('Backup is larger than the supported safety limits.');
  }

  const topicIds = new Set<string>();
  const topics = rawTopics.flatMap((value) => {
    const item = record(value);
    if (!item) return [];
    const id = text(item.id, 160);
    const title = text(item.title, 300);
    const subject = text(item.subject, 160);
    if (!id || !title || !subject || topicIds.has(id)) return [];
    topicIds.add(id);
    return [
      {
        id,
        repository: enumValue(
          item.repository,
          repositories,
          'revision-solved' as const,
        ),
        subject,
        title,
        status: enumValue(item.status, statuses, 'not_covered' as const),
        confidence: nullableEnum<'R' | 'H' | 'M'>(item.confidence, marks),
        priority: enumValue(item.priority, priorities, 'normal' as const),
        targetDate: date(item.target_date),
        lastRevisedAt: date(item.last_revised_at),
        nextDueAt: date(item.next_due_at),
        revisionCount: integer(item.revision_count, 0, 0, 100000),
        recallStreak: integer(item.recall_streak, 0, 0, 100000),
        proof: text(item.proof, 12000),
        notes: text(item.notes, 12000),
        urgencyOverride: nullableEnum<'urgent' | 'soon' | 'ready'>(
          item.urgency_override,
          urgencies,
        ),
        estimatedMinutes: integer(item.estimated_minutes, 30, 5, 600),
        sourceUrl: sourceUrl(item.source_url),
        createdAt: timestamp(item.created_at, now),
        updatedAt: timestamp(item.updated_at, now),
      },
    ];
  });
  if (!topics.length) throw new Error('Backup contains no valid topics.');

  const subtopicIds = new Set<string>();
  const subtopics = rawSubtopics.flatMap((value) => {
    const item = record(value);
    if (!item) return [];
    const id = text(item.id, 180);
    const topicId = text(item.topic_id, 160);
    const label = text(item.label, 600);
    if (!id || !topicIds.has(topicId) || !label || subtopicIds.has(id))
      return [];
    subtopicIds.add(id);
    return [
      {
        id,
        topicId,
        label,
        covered: item.covered === true || item.covered === 1 ? 1 : 0,
        coveredAt: timestamp(item.covered_at, '') || null,
        sortOrder: integer(item.sort_order, 0, 0, 100000),
        sourceUrl: sourceUrl(item.source_url),
        createdAt: timestamp(item.created_at, now),
        updatedAt: timestamp(item.updated_at, now),
      },
    ];
  });

  const revisionKeys = new Set<string>();
  const revisions = rawRevisions.flatMap((value) => {
    const item = record(value);
    if (!item) return [];
    const topicId = text(item.topic_id, 160);
    const revisedAt = date(item.revised_at);
    const nextDueAt = date(item.next_due_at);
    const mark = nullableEnum<'R' | 'H' | 'M'>(item.mark, marks);
    const createdAt = timestamp(item.created_at, now);
    const revisionKey = `${topicId}\u0000${mark}\u0000${revisedAt}\u0000${createdAt}`;
    if (
      !topicIds.has(topicId) ||
      !revisedAt ||
      !nextDueAt ||
      !mark ||
      revisionKeys.has(revisionKey)
    )
      return [];
    revisionKeys.add(revisionKey);
    return [
      {
        topicId,
        mark,
        revisedAt,
        nextDueAt,
        proof: text(item.proof, 12000),
        notes: text(item.notes, 12000),
        durationMinutes: integer(item.duration_minutes, 0, 0, 600),
        reflection: text(item.reflection, 12000),
        mood: enumValue(item.mood, moods, 'steady' as const),
        mistakeCategory: enumValue(
          item.mistake_category,
          mistakeCategories,
          'none' as const,
        ),
        repairAction: text(item.repair_action, 12000),
        createdAt,
      },
    ];
  });

  const urgentWindowDays = integer(rawSettings.urgent_window_days, 0, 0, 30);
  const recalledFirstDays = integer(rawSettings.recalled_first_days, 7, 1, 120);
  const recalledSecondDays = integer(
    rawSettings.recalled_second_days,
    14,
    recalledFirstDays,
    180,
  );
  const settings = {
    urgentWindowDays,
    yellowWindowDays: integer(
      rawSettings.yellow_window_days,
      3,
      urgentWindowDays,
      60,
    ),
    missedIntervalDays: integer(rawSettings.missed_interval_days, 1, 1, 30),
    hesitantIntervalDays: integer(rawSettings.hesitant_interval_days, 3, 1, 60),
    recalledFirstDays,
    recalledSecondDays,
    recalledMasteredDays: integer(
      rawSettings.recalled_mastered_days,
      30,
      recalledSecondDays,
      365,
    ),
    dailyGoalMinutes: integer(rawSettings.daily_goal_minutes, 60, 10, 600),
    focusBlockMinutes: integer(rawSettings.focus_block_minutes, 30, 5, 180),
  };

  return {
    schemaVersion: 2 as const,
    exportedAt: timestamp(root.exportedAt, now),
    topics,
    subtopics,
    revisions,
    settings,
    skipped: {
      topics: rawTopics.length - topics.length,
      subtopics: rawSubtopics.length - subtopics.length,
      revisions: rawRevisions.length - revisions.length,
    },
  };
}
