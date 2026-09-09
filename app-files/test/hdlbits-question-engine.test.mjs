import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getHdlBitsQuestion,
  hdlBitsQuestions,
  hdlBitsSeries,
  pickHdlBitsQuestion,
  sessionQuestionsFor,
  timeLimitFor,
} from '../lib/hdlbits-question-engine.ts';

test('question deck mirrors the complete local HDLBits archive', () => {
  assert.equal(hdlBitsQuestions.length, 178);
  assert.equal(
    new Set(hdlBitsQuestions.map((question) => question.id)).size,
    178,
  );
  assert.equal(
    new Set(hdlBitsQuestions.map((question) => question.slug)).size,
    178,
  );
  assert.equal(hdlBitsQuestions[0].number, 1);
  assert.equal(hdlBitsQuestions.at(-1).number, 179);
  assert.equal(
    hdlBitsQuestions.some((question) => question.number === 120),
    false,
  );
  assert.ok(
    hdlBitsQuestions.every(
      (question) =>
        question.url.startsWith('https://hdlbits.01xz.net/wiki/') &&
        question.estimatedMinutes >= 1,
    ),
  );
});

test('curated series are non-overlapping and include valid ordered questions', () => {
  const assigned = hdlBitsSeries.flatMap((series) => series.numbers);
  assert.equal(new Set(assigned).size, assigned.length);
  for (const series of hdlBitsSeries) {
    const questions = series.numbers.map((number) =>
      hdlBitsQuestions.find((question) => question.number === number),
    );
    assert.ok(
      questions.every(Boolean),
      `${series.name} has a missing question`,
    );
    questions.forEach((question, index) => {
      assert.equal(question.seriesId, series.id);
      assert.equal(question.seriesIndex, index + 1);
      assert.equal(question.seriesLength, series.numbers.length);
    });
  }
});

test('smart series gives every related part one complete time budget', () => {
  const lemmings = getHdlBitsQuestion('hdlbits-119');
  assert.ok(lemmings);
  const sprint = sessionQuestionsFor(lemmings, 'smart-series');
  assert.deepEqual(
    sprint.map((question) => question.number),
    [119, 159, 160, 161],
  );
  assert.equal(
    timeLimitFor(sprint),
    sprint.reduce((total, question) => total + question.estimatedMinutes, 0),
  );
  assert.deepEqual(
    sessionQuestionsFor(lemmings, 'single').map((question) => question.number),
    [119],
  );
});

test('picker favors unseen questions and weak-spots mode uses attempt history', () => {
  const first = pickHdlBitsQuestion({
    focus: 'all',
    history: [],
    random: () => 0,
  });
  const next = pickHdlBitsQuestion({
    focus: 'all',
    history: [{ questionId: first.id, startedAt: '2026-09-01T00:00:00.000Z' }],
    random: () => 0,
  });
  assert.notEqual(next.id, first.id);

  const weak = pickHdlBitsQuestion({
    focus: 'weak-spots',
    history: [],
    random: () => 0,
  });
  assert.ok(weak.successRate < 70 || weak.totalAttempts >= 4);
});
