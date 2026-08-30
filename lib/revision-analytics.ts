import { addDays, daysUntil, localDate } from './revision-engine.ts';

export type AnalyticsRecallMark = 'R' | 'H' | 'M';

export type AnalyticsRevision = {
  topic_id: string;
  mark: AnalyticsRecallMark;
  revised_at: string;
  duration_minutes: number;
  mood?: string | null;
  notes?: string | null;
  mistake_category?: string | null;
  repair_action?: string | null;
};

export type AnalyticsTopic = {
  id: string;
  status: 'not_covered' | 'in_progress' | 'covered';
  confidence: AnalyticsRecallMark | null;
  recall_streak: number;
  next_due_at: string | null;
  target_date: string | null;
  estimated_minutes: number;
};

export type ActivityDay = {
  date: string;
  minutes: number;
  sessions: number;
  intensity: 0 | 1 | 2 | 3 | 4;
};

export type ForecastDay = {
  date: string;
  topicIds: string[];
  minutes: number;
};

export type RepairSignal = {
  topicId: string;
  mark: AnalyticsRecallMark;
  revisedAt: string;
  mistakeCategory: string;
  repairAction: string;
  notes: string;
};

function uniqueSortedDates(revisions: AnalyticsRevision[]) {
  return [
    ...new Set(
      revisions
        .map((revision) => revision.revised_at)
        .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date)),
    ),
  ].sort();
}

function consecutiveRunEndingAt(dateSet: Set<string>, end: string) {
  let streak = 0;
  let cursor = end;
  while (dateSet.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function revisionStreaks(
  revisions: AnalyticsRevision[],
  today = localDate(),
) {
  const dates = uniqueSortedDates(revisions);
  const dateSet = new Set(dates);
  const activeEnd = dateSet.has(today) ? today : addDays(today, -1);
  const current = consecutiveRunEndingAt(dateSet, activeEnd);
  let best = 0;
  let run = 0;
  let previous: string | null = null;

  for (const date of dates) {
    run = previous && addDays(previous, 1) === date ? run + 1 : 1;
    best = Math.max(best, run);
    previous = date;
  }

  return { current, best };
}

export function activityTimeline(
  revisions: AnalyticsRevision[],
  days = 14,
  today = localDate(),
): ActivityDay[] {
  const safeDays = Math.max(1, Math.min(60, Math.round(days)));
  const minutesByDate = new Map<string, number>();
  const sessionsByDate = new Map<string, number>();

  for (const revision of revisions) {
    const minutes = Math.max(0, Number(revision.duration_minutes || 0));
    minutesByDate.set(
      revision.revised_at,
      (minutesByDate.get(revision.revised_at) ?? 0) + minutes,
    );
    sessionsByDate.set(
      revision.revised_at,
      (sessionsByDate.get(revision.revised_at) ?? 0) + 1,
    );
  }

  return Array.from({ length: safeDays }, (_, index) => {
    const date = addDays(today, index - safeDays + 1);
    const minutes = minutesByDate.get(date) ?? 0;
    const sessions = sessionsByDate.get(date) ?? 0;
    const intensity: ActivityDay['intensity'] =
      minutes === 0
        ? 0
        : minutes < 20
          ? 1
          : minutes < 45
            ? 2
            : minutes < 75
              ? 3
              : 4;
    return { date, minutes, sessions, intensity };
  });
}

export function dueForecast(
  topics: AnalyticsTopic[],
  days = 7,
  today = localDate(),
): ForecastDay[] {
  const safeDays = Math.max(1, Math.min(31, Math.round(days)));
  const forecast = Array.from({ length: safeDays }, (_, index) => ({
    date: addDays(today, index),
    topicIds: [] as string[],
    minutes: 0,
  }));

  for (const topic of topics) {
    const due = topic.next_due_at ?? topic.target_date;
    if (!due) continue;
    let offset: number;
    try {
      offset = daysUntil(due, today);
    } catch {
      continue;
    }
    if (offset >= safeDays) continue;
    const bucket = forecast[Math.max(0, offset)];
    bucket.topicIds.push(topic.id);
    bucket.minutes += Math.max(5, Number(topic.estimated_minutes || 30));
  }

  return forecast;
}

export function topicMemoryStrength(
  topic: AnalyticsTopic,
  today = localDate(),
) {
  const hasRecallEvidence =
    topic.status !== 'not_covered' ||
    Boolean(topic.confidence) ||
    Number(topic.recall_streak || 0) > 0;
  if (!hasRecallEvidence) return 0;

  let score =
    topic.status === 'covered' ? 28 : topic.status === 'in_progress' ? 14 : 0;
  score += topic.confidence === 'R' ? 32 : topic.confidence === 'H' ? 16 : 0;
  score += Math.min(24, Math.max(0, Number(topic.recall_streak || 0)) * 8);

  const due = topic.next_due_at ?? topic.target_date;
  if (due) {
    try {
      const distance = daysUntil(due, today);
      score +=
        distance >= 4 ? 16 : distance >= 0 ? 10 : Math.max(0, 8 + distance * 2);
    } catch {
      // Invalid imported dates contribute no recency points.
    }
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function buildLearningAnalytics({
  revisions,
  topics,
  dailyGoalMinutes,
  today = localDate(),
}: {
  revisions: AnalyticsRevision[];
  topics: AnalyticsTopic[];
  dailyGoalMinutes: number;
  today?: string;
}) {
  const recall = revisions.reduce(
    (counts, revision) => {
      counts[revision.mark] += 1;
      return counts;
    },
    { R: 0, H: 0, M: 0 },
  );
  const totalRecalls = recall.R + recall.H + recall.M;
  const activity = activityTimeline(revisions, 14, today);
  const todayActivity = activity.at(-1) ?? {
    date: today,
    minutes: 0,
    sessions: 0,
    intensity: 0 as const,
  };
  const weekActivity = activity.slice(-7);
  const streaks = revisionStreaks(revisions, today);
  const strengths = topics.map((topic) => topicMemoryStrength(topic, today));
  const latestByTopic = new Map<string, AnalyticsRevision>();
  for (const revision of revisions) {
    const current = latestByTopic.get(revision.topic_id);
    if (!current || revision.revised_at > current.revised_at) {
      latestByTopic.set(revision.topic_id, revision);
    }
  }
  const repairQueue: RepairSignal[] = [...latestByTopic.values()]
    .filter(
      (revision) =>
        revision.mark !== 'R' ||
        Boolean(revision.repair_action?.trim()) ||
        Boolean(
          revision.mistake_category && revision.mistake_category !== 'none',
        ),
    )
    .sort(
      (a, b) =>
        (a.mark === 'M' ? 0 : a.mark === 'H' ? 1 : 2) -
          (b.mark === 'M' ? 0 : b.mark === 'H' ? 1 : 2) ||
        b.revised_at.localeCompare(a.revised_at),
    )
    .map((revision) => ({
      topicId: revision.topic_id,
      mark: revision.mark,
      revisedAt: revision.revised_at,
      mistakeCategory: revision.mistake_category || 'none',
      repairAction: revision.repair_action?.trim() || '',
      notes: revision.notes?.trim() || '',
    }));

  const mistakeCounts = revisions.reduce<Record<string, number>>(
    (counts, revision) => {
      const category = revision.mistake_category?.trim();
      if (category && category !== 'none') {
        counts[category] = (counts[category] ?? 0) + 1;
      }
      return counts;
    },
    {},
  );
  const topMistake = Object.entries(mistakeCounts).sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  )[0];
  const goal = Math.max(10, Number(dailyGoalMinutes || 60));

  return {
    activity,
    forecast: dueForecast(topics, 7, today),
    recall,
    retentionRate: totalRecalls
      ? Math.round((recall.R / totalRecalls) * 100)
      : 0,
    totalRecalls,
    todayMinutes: todayActivity.minutes,
    todaySessions: todayActivity.sessions,
    dailyGoalMinutes: goal,
    dailyGoalPercent: Math.min(
      100,
      Math.round((todayActivity.minutes / goal) * 100),
    ),
    weekMinutes: weekActivity.reduce((sum, day) => sum + day.minutes, 0),
    weekSessions: weekActivity.reduce((sum, day) => sum + day.sessions, 0),
    currentStreak: streaks.current,
    bestStreak: streaks.best,
    memoryStrength: strengths.length
      ? Math.round(
          strengths.reduce((sum, score) => sum + score, 0) / strengths.length,
        )
      : 0,
    repairQueue,
    topMistake: topMistake
      ? { category: topMistake[0], count: topMistake[1] }
      : null,
  };
}
