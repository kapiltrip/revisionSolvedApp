import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { topicSeeds } from '../data/topic-seed.ts';
import { subtopicSeedsForTopic } from '../data/subtopic-seed.ts';
import {
  attachmentMime,
  entryInput,
  safeSourceUrl,
} from '../lib/maven/input.ts';
const hasPrivateContent =
  JSON.parse(
    fs.readFileSync(
      new URL('../content/maven/catalog.json', import.meta.url),
      'utf8',
    ),
  ).sourceMode !== 'empty';

test(
  'all 98 source questions preserve question, handwriting and navigable discussions',
  { skip: !hasPrivateContent },
  () => {
    assert.equal(topicSeeds.length, 98);
    assert.equal(new Set(topicSeeds.map((t) => t.id)).size, 98);
    for (let n = 1; n <= 5; n++) {
      const material = JSON.parse(
        fs.readFileSync(
          new URL(`../content/maven/assignment-0${n}.json`, import.meta.url),
          'utf8',
        ),
      );
      material.questions.forEach((q, index) => {
        assert.equal(q.number, index + 1);
        assert.ok(q.images.some((i) => i.kind === 'question'));
        assert.ok(q.images.some((i) => i.kind === 'solution'));
        assert.ok(q.html.length > 1000);
        assert.doesNotMatch(
          q.html,
          /<script|javascript:|onerror=|MAVENMATHPLACEHOLDER/,
        );
        assert.match(q.sourceUrl, /Assignments-Maven-Silicon/);
        for (const image of q.images)
          assert.ok(
            fs.existsSync(new URL('../public' + image.src, import.meta.url)),
            image.src,
          );
      });
    }
    assert.ok(
      topicSeeds.every(
        (t) => t.repository === 'maven-silicon' && t.targetDate === null,
      ),
    );
    assert.ok(topicSeeds.every((t) => subtopicSeedsForTopic(t).length === 4));
  },
);

test(
  'every imported source image has the original SHA-256 hash',
  { skip: !hasPrivateContent },
  () => {
    const manifest = JSON.parse(
      fs.readFileSync(
        new URL('../content/maven/source-manifest.json', import.meta.url),
        'utf8',
      ),
    );
    assert.equal(manifest.files.length, 248);
    for (const file of manifest.files) {
      const match = file.path.match(/^Assignment (\d+)\/Revision\/(.+)$/);
      assert.ok(match);
      const bytes = fs.readFileSync(
        new URL(
          `../public/maven/digital/assignment-${match[1]}/${match[2]}`,
          import.meta.url,
        ),
      );
      assert.equal(
        createHash('sha256').update(bytes).digest('hex'),
        file.sha256,
        file.path,
      );
    }
  },
);

test('capture validation rejects unsupported executable content and unsafe source links', () => {
  assert.equal(
    attachmentMime(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])),
    'image/png',
  );
  assert.equal(
    attachmentMime(new TextEncoder().encode('<svg onload="evil()">')),
    null,
  );
  assert.equal(safeSourceUrl('javascript:alert(1)'), null);
  assert.throws(
    () => entryInput({ kind: 'ask', title: 'Question', question_number: 1 }),
    /assignment/,
  );
  assert.throws(
    () =>
      entryInput({ kind: 'ask', title: 'Question', review_date: '2026-02-30' }),
    /valid review date/,
  );
  const entry = entryInput({
    kind: 'ask',
    title: '  My exact doubt  ',
    assignment_number: '7',
    question_number: '2',
    body: 'Keep my working',
  });
  assert.equal(entry.assignment, 7);
  assert.equal(entry.title, 'My exact doubt');
});
