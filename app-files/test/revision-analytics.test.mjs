import assert from 'node:assert/strict';
import test from 'node:test';

import {
  activityTimeline,
  buildLearningAnalytics,
  dueForecast,
  revisionStreaks,
  topicMemoryStrength,
} from '../lib/revision-analytics.ts';

const topic = {
  id: 'topic-1',
  status: 'covered',
  confidence: 'R',
  recall_streak: 2,
  next_due_at: '2026-09-04',
  target_date: null,
  estimated_minutes: 30,
};

const revisions = [
  {
    topic_id: 'topic-1',
    mark: 'R',
    revised_at: '2026-08-28',
    duration_minutes: 20,
    mood: 'steady',
    mistake_category: 'none',
    repair_action: '',
    notes: '',
  },
  {
    topic_id: 'topic-1',
    mark: 'H',
    revised_at: '2026-08-29',
    duration_minutes: 30,
    mood: 'foggy',
    mistake_category: 'timing',
    repair_action: 'Redraw the edge trace',
    notes: 'Off by one cycle',
  },
  {
    topic_id: 'topic-2',
    mark: 'R',
    revised_at: '2026-08-30',
    duration_minutes: 40,
    mood: 'energized',
    mistake_category: 'none',
    repair_action: '',
    notes: '',
  },
];

test('streaks count consecutive study days and remain active from yesterday', () => {
  assert.deepEqual(revisionStreaks(revisions, '2026-08-30'), {
    current: 3,
    best: 3,
  });
  assert.deepEqual(revisionStreaks(revisions, '2026-08-31'), {
    current: 3,
    best: 3,
  });
  assert.equal(revisionStreaks(revisions, '2026-09-02').current, 0);
});

test('activity timeline totals minutes and assigns stable intensity bands', () => {
  const activity = activityTimeline(revisions, 4, '2026-08-30');
  assert.deepEqual(
    activity.map(({ date, minutes, sessions, intensity }) => ({
      date,
      minutes,
      sessions,
      intensity,
    })),
    [
      { date: '2026-08-27', minutes: 0, sessions: 0, intensity: 0 },
      { date: '2026-08-28', minutes: 20, sessions: 1, intensity: 2 },
      { date: '2026-08-29', minutes: 30, sessions: 1, intensity: 2 },
      { date: '2026-08-30', minutes: 40, sessions: 1, intensity: 2 },
    ],
  );
});

test('forecast rolls overdue topics into today and ignores dates outside window', () => {
  const forecast = dueForecast(
    [
      { ...topic, id: 'overdue', next_due_at: '2026-08-20' },
      { ...topic, id: 'tomorrow', next_due_at: '2026-08-31' },
      { ...topic, id: 'later', next_due_at: '2026-09-20' },
    ],
    7,
    '2026-08-30',
  );
  assert.deepEqual(forecast[0].topicIds, ['overdue']);
  assert.deepEqual(forecast[1].topicIds, ['tomorrow']);
  assert.equal(
    forecast.reduce((sum, day) => sum + day.minutes, 0),
    60,
  );
});

test('learning analytics joins goals, recall outcomes, repair signals, and memory', () => {
  const analytics = buildLearningAnalytics({
    revisions,
    topics: [
      topic,
      {
        ...topic,
        id: 'topic-2',
        status: 'in_progress',
        confidence: 'H',
        recall_streak: 0,
      },
    ],
    dailyGoalMinutes: 60,
    today: '2026-08-30',
  });

  assert.equal(analytics.todayMinutes, 40);
  assert.equal(analytics.dailyGoalPercent, 67);
  assert.equal(analytics.currentStreak, 3);
  assert.equal(analytics.retentionRate, 67);
  assert.deepEqual(analytics.recall, { R: 2, H: 1, M: 0 });
  assert.equal(analytics.repairQueue[0].topicId, 'topic-1');
  assert.equal(analytics.repairQueue[0].mistakeCategory, 'timing');
  assert.deepEqual(analytics.topMistake, { category: 'timing', count: 1 });
  assert.ok(analytics.memoryStrength > 0);
  assert.ok(topicMemoryStrength(topic, '2026-08-30') <= 100);
});

test('untouched topics have zero memory strength until recall evidence exists', () => {
  assert.equal(
    topicMemoryStrength(
      {
        ...topic,
        status: 'not_covered',
        confidence: null,
        recall_streak: 0,
        target_date: '2026-09-20',
        next_due_at: null,
      },
      '2026-08-30',
    ),
    0,
  );
});
