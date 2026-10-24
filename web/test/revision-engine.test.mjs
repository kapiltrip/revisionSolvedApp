import assert from 'node:assert/strict';
import test from 'node:test';

import {
  addDays,
  daysUntil,
  isDateKey,
  recallIntervalDays,
  scheduleRevision,
  urgencyForTopic,
} from '../lib/revision-engine.ts';

const settings = {
  urgent_window_days: 0,
  yellow_window_days: 3,
  missed_interval_days: 1,
  hesitant_interval_days: 3,
  recalled_first_days: 7,
  recalled_second_days: 14,
  recalled_mastered_days: 30,
};

const topic = {
  urgency_override: null,
  confidence: null,
  next_due_at: null,
  target_date: null,
  priority: 'normal',
};

test('calendar arithmetic is stable across month and leap-year boundaries', () => {
  assert.equal(addDays('2024-02-28', 1), '2024-02-29');
  assert.equal(addDays('2024-02-28', 2), '2024-03-01');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(daysUntil('2026-09-02', '2026-08-30'), 3);
  assert.throws(() => daysUntil('2026-02-30', '2026-02-01'));
  assert.equal(isDateKey('2026-02-28'), true);
  assert.equal(isDateKey('2026-02-30'), false);
  assert.equal(isDateKey(20260830), false);
});

test('manual urgency and recall evidence override date-based color windows', () => {
  assert.equal(
    urgencyForTopic(
      { ...topic, urgency_override: 'ready', confidence: 'M' },
      settings,
      '2026-08-30',
    ),
    'ready',
  );
  assert.equal(
    urgencyForTopic(
      { ...topic, confidence: 'M', target_date: '2026-10-01' },
      settings,
      '2026-08-30',
    ),
    'urgent',
  );
  assert.equal(
    urgencyForTopic(
      { ...topic, confidence: 'H', target_date: '2026-10-01' },
      settings,
      '2026-08-30',
    ),
    'soon',
  );
});

test('automatic urgency respects exact orange and yellow boundaries', () => {
  assert.equal(
    urgencyForTopic(
      { ...topic, target_date: '2026-08-30' },
      settings,
      '2026-08-30',
    ),
    'urgent',
  );
  assert.equal(
    urgencyForTopic(
      { ...topic, target_date: '2026-09-02' },
      settings,
      '2026-08-30',
    ),
    'soon',
  );
  assert.equal(
    urgencyForTopic(
      { ...topic, target_date: '2026-09-03' },
      settings,
      '2026-08-30',
    ),
    'ready',
  );
  assert.equal(
    urgencyForTopic({ ...topic, priority: 'high' }, settings, '2026-08-30'),
    'urgent',
  );
});

test('R/H/M scheduling follows the configured recall ladder', () => {
  assert.equal(recallIntervalDays('M', 8, settings), 1);
  assert.equal(recallIntervalDays('H', 8, settings), 3);
  assert.equal(recallIntervalDays('R', 0, settings), 7);
  assert.equal(recallIntervalDays('R', 1, settings), 14);
  assert.equal(recallIntervalDays('R', 2, settings), 30);

  assert.deepEqual(
    scheduleRevision({
      mark: 'R',
      recallStreak: 1,
      revisedAt: '2026-08-30',
      settings,
    }),
    {
      intervalDays: 14,
      nextDueAt: '2026-09-13',
      nextRecallStreak: 2,
    },
  );
  assert.deepEqual(
    scheduleRevision({
      mark: 'M',
      recallStreak: 4,
      revisedAt: '2026-08-30',
      settings,
    }),
    {
      intervalDays: 1,
      nextDueAt: '2026-08-31',
      nextRecallStreak: 0,
    },
  );
});
