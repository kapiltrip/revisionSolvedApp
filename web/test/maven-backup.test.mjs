import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { mavenSchema } from '../lib/maven/archive.ts';
import { parseMavenBackup, restoreMavenData } from '../lib/maven/backup.ts';
import { parseRevisionBackup } from '../lib/revision-backup.ts';

const bytes = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j8oIAAAAASUVORK5CYII=',
  'base64',
);
const now = '2026-10-24T13:00:00.000Z';
function fixture() {
  return {
    profile: { id: 'default', current_assignment: 7, updated_at: now },
    entries: [
      {
        id: 'entry-1',
        kind: 'ask',
        title: 'Why this transition?',
        body: 'My original question',
        assignment_number: 7,
        question_number: 2,
        status: 'open',
        answer: '',
        trainer: '',
        review_date: null,
        repair_action: '',
        source_url: null,
        created_at: now,
        updated_at: now,
      },
    ],
    attachments: [
      {
        id: 'file-1',
        entry_id: 'entry-1',
        name: 'original.png',
        mime_type: 'image/png',
        byte_length: bytes.length,
        sha256: createHash('sha256').update(bytes).digest('hex'),
        data_base64: '',
        created_at: now,
      },
    ],
    chunks: [
      {
        attachment_id: 'file-1',
        chunk_index: 0,
        data_base64: bytes.toString('base64'),
      },
    ],
    events: [],
    archive: [],
  };
}

test('Maven backup retains original attachment bytes and trainer-question context', () => {
  const parsed = parseMavenBackup(fixture());
  assert.equal(parsed.entries[0].assignment_number, 7);
  assert.equal(parsed.entries[0].question_number, 2);
  assert.deepEqual(Buffer.from(parsed.chunks[0].data_base64, 'base64'), bytes);
  const root = parseRevisionBackup({
    schemaVersion: 4,
    maven: fixture(),
    topics: [],
    subtopics: [],
    revisions: [],
    settings: {},
  });
  assert.equal(root.topics.length, 0);
});

test('damaged, missing and conflicting original image chunks are rejected before restore', () => {
  const tampered = fixture();
  tampered.chunks[0].data_base64 = Buffer.from('broken').toString('base64');
  assert.throws(() => parseMavenBackup(tampered), /SHA-256/);
  const missing = fixture();
  missing.chunks[0].chunk_index = 1;
  assert.throws(() => parseMavenBackup(missing), /missing/);
  const duplicate = fixture();
  duplicate.entries.push({ ...duplicate.entries[0] });
  assert.throws(() => parseMavenBackup(duplicate), /duplicate/);
  const orphan = fixture();
  orphan.attachments[0].entry_id = 'missing';
  assert.throws(() => parseMavenBackup(orphan), /metadata/);
});

test('restoring twice preserves newer responses and does not duplicate original images', async () => {
  const sqlite = new DatabaseSync(':memory:');
  mavenSchema.forEach((sql) => sqlite.exec(sql));
  function statement(sql, args = []) {
    return {
      bind(...values) {
        return statement(sql, values);
      },
      first() {
        return sqlite.prepare(sql).get(...args) ?? null;
      },
      execute() {
        return sqlite.prepare(sql).run(...args);
      },
    };
  }
  const db = {
    prepare: statement,
    batch(statements) {
      sqlite.exec('BEGIN');
      try {
        for (const s of statements) s.execute();
        sqlite.exec('COMMIT');
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    },
  };
  const parsed = parseMavenBackup(fixture());
  await restoreMavenData(db, parsed);
  sqlite.exec(
    "UPDATE maven_entries SET answer='Newer trainer response',updated_at='2026-10-25T10:00:00.000Z'",
  );
  await restoreMavenData(db, parsed);
  assert.equal(
    sqlite.prepare('SELECT answer FROM maven_entries').get().answer,
    'Newer trainer response',
  );
  assert.equal(
    sqlite.prepare('SELECT COUNT(*) AS n FROM maven_attachments').get().n,
    1,
  );
  assert.equal(
    sqlite.prepare('SELECT COUNT(*) AS n FROM maven_attachment_chunks').get().n,
    1,
  );
});
