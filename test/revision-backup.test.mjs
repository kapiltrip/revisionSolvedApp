import assert from 'node:assert/strict';
import test from 'node:test';

import { parseRevisionBackup } from '../lib/revision-backup.ts';

const now = '2026-08-30T00:00:00.000Z';

function validBackup() {
  return {
    exportedAt: now,
    settings: {
      urgent_window_days: 1,
      yellow_window_days: 4,
      daily_goal_minutes: 75,
      focus_block_minutes: 35,
    },
    topics: [
      {
        id: 'topic-1',
        repository: 'hdlbits',
        subject: 'HDLBits · FSM',
        title: 'Serial receiver',
        status: 'in_progress',
        confidence: 'H',
        priority: 'high',
        target_date: '2026-09-01',
        last_revised_at: '2026-08-30',
        next_due_at: '2026-09-02',
        revision_count: 2,
        recall_streak: 0,
        estimated_minutes: 35,
        source_url: 'https://github.com/kapiltrip/hdlBits',
        created_at: now,
        updated_at: now,
      },
    ],
    subtopics: [
      {
        id: 'check-1',
        topic_id: 'topic-1',
        label: 'Rebuild the receiver states blind',
        covered: true,
        sort_order: 0,
        created_at: now,
        updated_at: now,
      },
    ],
    revisions: [
      {
        topic_id: 'topic-1',
        mark: 'H',
        revised_at: '2026-08-30',
        next_due_at: '2026-09-02',
        duration_minutes: 34,
        mood: 'steady',
        mistake_category: 'state',
        repair_action: 'Draw the transition table without source',
        created_at: now,
      },
    ],
  };
}

test('backup parser validates and preserves the complete supported model', () => {
  const parsed = parseRevisionBackup(validBackup(), now);
  assert.equal(parsed.schemaVersion, 2);
  assert.equal(parsed.topics[0].repository, 'hdlbits');
  assert.equal(parsed.subtopics[0].covered, 1);
  assert.equal(parsed.revisions[0].mistakeCategory, 'state');
  assert.equal(parsed.settings.dailyGoalMinutes, 75);
  assert.equal(parsed.settings.focusBlockMinutes, 35);
  assert.deepEqual(parsed.skipped, { topics: 0, subtopics: 0, revisions: 0 });
});

test('backup parser rejects incomplete roots and impossible date records', () => {
  assert.throws(() => parseRevisionBackup({}, now), /missing topics/i);
  const withoutSettings = validBackup();
  delete withoutSettings.settings;
  assert.throws(
    () => parseRevisionBackup(withoutSettings, now),
    /missing topics/i,
  );
  const backup = validBackup();
  backup.topics[0].target_date = '2026-02-30';
  backup.revisions[0].revised_at = '2026-02-30';
  const parsed = parseRevisionBackup(backup, now);
  assert.equal(parsed.topics[0].targetDate, null);
  assert.equal(parsed.revisions.length, 0);
  assert.equal(parsed.skipped.revisions, 1);
});

test('backup parser sanitizes unsafe enum, protocol, range, and duplicate data', () => {
  const backup = validBackup();
  backup.topics.push({
    ...backup.topics[0],
    id: 'topic-2',
    repository: 'unknown',
    source_url: 'javascript:alert(1)',
    estimated_minutes: 99999,
  });
  backup.topics.push({ ...backup.topics[0] });
  backup.subtopics.push({
    ...backup.subtopics[0],
    id: 'orphan-check',
    topic_id: 'topic-outside-backup',
  });
  backup.revisions.push({ ...backup.revisions[0] });
  backup.revisions.push({
    ...backup.revisions[0],
    topic_id: 'topic-outside-backup',
    created_at: '2026-08-30T01:00:00.000Z',
  });
  const parsed = parseRevisionBackup(backup, now);
  assert.equal(parsed.topics.length, 2);
  assert.equal(parsed.topics[1].repository, 'revision-solved');
  assert.equal(parsed.topics[1].sourceUrl, null);
  assert.equal(parsed.topics[1].estimatedMinutes, 600);
  assert.equal(parsed.skipped.topics, 1);
  assert.equal(parsed.subtopics.length, 1);
  assert.equal(parsed.revisions.length, 1);
  assert.equal(parsed.skipped.subtopics, 1);
  assert.equal(parsed.skipped.revisions, 2);
});
