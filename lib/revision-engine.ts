export type RecallMark = 'R' | 'H' | 'M';
export type RevisionUrgency = 'urgent' | 'soon' | 'ready';

export type RevisionTimingSettings = {
  urgent_window_days: number;
  yellow_window_days: number;
  missed_interval_days: number;
  hesitant_interval_days: number;
  recalled_first_days: number;
  recalled_second_days: number;
  recalled_mastered_days: number;
};

export type SchedulableTopic = {
  urgency_override: RevisionUrgency | null;
  confidence: RecallMark | null;
  next_due_at: string | null;
  target_date: string | null;
  priority: 'high' | 'medium' | 'normal';
};

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const millisecondsPerDay = 86_400_000;

function parseDateKey(date: string) {
  if (!datePattern.test(date)) {
    throw new Error(`Invalid calendar date: ${date}`);
  }

  const [year, month, day] = date.split('-').map(Number);
  const milliseconds = Date.UTC(year, month - 1, day);
  const roundTrip = new Date(milliseconds).toISOString().slice(0, 10);
  if (roundTrip !== date) {
    throw new Error(`Invalid calendar date: ${date}`);
  }
  return milliseconds;
}

export function isDateKey(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    parseDateKey(value);
    return true;
  } catch {
    return false;
  }
}

export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function daysUntil(date: string, today = localDate()) {
  return Math.round(
    (parseDateKey(date) - parseDateKey(today)) / millisecondsPerDay,
  );
}

export function addDays(date: string, days: number) {
  const value = new Date(parseDateKey(date));
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function urgencyForTopic(
  topic: SchedulableTopic,
  settings: RevisionTimingSettings,
  today = localDate(),
): RevisionUrgency {
  if (topic.urgency_override) return topic.urgency_override;
  if (topic.confidence === 'M') return 'urgent';
  if (topic.confidence === 'H') return 'soon';

  const date = topic.next_due_at ?? topic.target_date;
  if (!date) return topic.priority === 'high' ? 'urgent' : 'soon';

  const days = daysUntil(date, today);
  if (days <= settings.urgent_window_days) return 'urgent';
  if (days <= settings.yellow_window_days) return 'soon';
  return 'ready';
}

export function recallIntervalDays(
  mark: RecallMark,
  recallStreak: number,
  settings: RevisionTimingSettings,
) {
  if (mark === 'M') return settings.missed_interval_days;
  if (mark === 'H') return settings.hesitant_interval_days;
  if (recallStreak <= 0) return settings.recalled_first_days;
  if (recallStreak === 1) return settings.recalled_second_days;
  return settings.recalled_mastered_days;
}

export function scheduleRevision({
  mark,
  recallStreak,
  revisedAt,
  settings,
}: {
  mark: RecallMark;
  recallStreak: number;
  revisedAt: string;
  settings: RevisionTimingSettings;
}) {
  const intervalDays = recallIntervalDays(mark, recallStreak, settings);
  return {
    intervalDays,
    nextDueAt: addDays(revisedAt, intervalDays),
    nextRecallStreak: mark === 'R' ? Math.max(0, recallStreak) + 1 : 0,
  };
}
