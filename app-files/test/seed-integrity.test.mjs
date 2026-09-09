import assert from 'node:assert/strict';
import test from 'node:test';

import { subtopicSeedsForTopic } from '../data/subtopic-seed.ts';
import { topicSeeds } from '../data/topic-seed.ts';

test('topic and subtopic identifiers remain unique', () => {
  const topicIds = topicSeeds.map((topic) => topic.id);
  assert.equal(new Set(topicIds).size, topicIds.length);

  const subtopics = topicSeeds.flatMap(subtopicSeedsForTopic);
  const subtopicIds = subtopics.map((subtopic) => subtopic.id);
  assert.equal(new Set(subtopicIds).size, subtopicIds.length);
  assert.ok(subtopics.every((subtopic) => topicIds.includes(subtopic.topicId)));
});

test('HDLBits mirrors the complete 17-batch and 24-weakness archive plan', () => {
  const hdlBitsTopics = topicSeeds.filter(
    (topic) => topic.repository === 'hdlbits',
  );
  const batches = hdlBitsTopics.filter((topic) =>
    topic.id.startsWith('hdlbits-b'),
  );
  const weaknessLabs = hdlBitsTopics.filter((topic) =>
    topic.id.startsWith('hdlbits-weaknesses-'),
  );

  assert.equal(hdlBitsTopics.length, 19);
  assert.equal(batches.length, 17);
  assert.equal(weaknessLabs.length, 2);
  assert.equal(batches[0].targetDate, '2026-08-30');
  assert.equal(batches.at(-1).targetDate, '2026-09-15');
  assert.ok(
    hdlBitsTopics.every((topic) =>
      topic.sourceUrl.includes('github.com/kapiltrip/hdlBits'),
    ),
  );

  const batchChecks = batches.flatMap(subtopicSeedsForTopic);
  const weaknessChecks = weaknessLabs.flatMap(subtopicSeedsForTopic);
  assert.equal(batchChecks.length, 68);
  assert.equal(weaknessChecks.length, 24);
  assert.equal(batchChecks.length + weaknessChecks.length, 92);
});

test('every seeded topic produces a useful multi-step quick check', () => {
  for (const topic of topicSeeds) {
    const checks = subtopicSeedsForTopic(topic);
    assert.ok(checks.length >= 4, `${topic.id} has fewer than four checks`);
    assert.ok(checks.every((check) => check.label.trim().length >= 8));
  }
});
